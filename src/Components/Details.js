import { Component } from 'react';
import { Carousel } from 'react-responsive-carousel';
import queryString from 'query-string';
import axios from 'axios';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Modal from 'react-modal';

import "react-responsive-carousel/lib/styles/carousel.min.css";
import 'react-tabs/style/react-tabs.css';
import "../Styles/details.css";



const constants = require('../constants');
const API_URL=constants.API_URL; 

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)', 
        border: '2px solid tomato',
        width: '550px'
    }
};

let User, user,count=0; 
// debugger      


var menuDetails=[];
let menuDetailsObject= {
    restaurantName: undefined,
    menuItem: {
        itemName: undefined,
        quantity: 0,
    },

}
var quant=[];

class Details extends Component {


    constructor() {
        super();
        this.state = {
            restaurant: undefined,
            isMenuModalOpen: false,
            menu: [],
            totalPrice: 0,
            User: localStorage.getItem('user'),
            quant: []
            
        };
    }
    
    componentDidMount() {
        // get the restaurant id from the query params
        const qs = queryString.parse(this.props.location.search);
        const { id } = qs;

        // make an API call to get the restaurant details for the given id
        axios.get(`${API_URL}/api/getRestaurantById/${id}`)
            .then(result => {
                this.setState({
                    restaurant: result.data.restaurant[0]
                    
                });
            }) 
            .catch(error => {
                console.log(error); 
            });
           // debugger
        axios.get(`${API_URL}/api/getMenuByRestaurant/${id}`)
            .then(result => {
                this.setState({
                    menu: result.data.menu,
                    
                });
            })
            .catch(error => {
                console.log(error);
            });
            
    }
    
    openMenuHandler = () => {
        this.setState({
            isMenuModalOpen: true
        });
    }

    closeMenuHandler = () => {
        menuDetails=[];
        this.setState({
            isMenuModalOpen: false,
            totalPrice: 0
        });
    }

    
     
    addItemHnadler = (item,restaurant,index) => {
        //debugger
        var flag=0;
        var ind=index;
    
        for(let i=0;i<menuDetails.length; i++){
            if(menuDetails[i].menuItem.itemName===item.itemName)
            {
                menuDetails[i].menuItem.quantity+=1;
                flag=1;
                break
            }
        }
        if(flag==0){
            
            menuDetailsObject= {
                restaurantName: restaurant.name,
                menuItem: {
                    itemName: item.itemName,
                    quantity: 1,
                },               
            }
            menuDetails.push(menuDetailsObject);
        }

        debugger
        const { totalPrice } = this.state;
        this.setState({   
            totalPrice: totalPrice + item.itemPrice
        });
        debugger
    }
    
    removeItemHnadler=(item,index)=>{
        const { totalPrice } = this.state;


        if(totalPrice>0){
            for(let i=0;i<menuDetails.length; i++){
                if(menuDetails[i].menuItem.itemName===item.itemName)
                {
                    
                    if(menuDetails[i].menuItem.quantity>0){
                        menuDetails[i].menuItem.quantity-=1;
                        if(menuDetails[i].menuItem.quantity==0)
                        {
                            if(menuDetails.length==1)
                            menuDetails=[];
                            
                            menuDetails.splice(i, i);
                            //debugger
                        }

                        this.setState({
                            totalPrice: totalPrice - item.itemPrice
                        });
                    }
                    else{
                        menuDetails.splice(i, i);
                        this.setState({
                            totalPrice: totalPrice -item.itemPrice
                            
                        });
            
                    }            
                }
            }
        }
        //debugger


        
        
    }

    getCheckSum = (data) => {
        return fetch(`${API_URL}/api/payment`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                "Content-Type": 'application/json'
            },
            body: JSON.stringify(data)
        }).then(result => {
           //debugger
           return result.json();
        }).catch(error => {
            console.log(error);
        });
    }

    isObj = (val) => {
        return typeof val === 'object';
    }

    isDate = (val) => {
        return Object.prototype.toString.call(val) === '[object Date]';
    }

    stringifyValue = (value) => {
        if (this.isObj(value) && !this.isDate(value)) {
            return JSON.stringify(value);
        } else {
            return value;
        }
    }

    builfForm = (details) => {
        const { action, params } = details;

        const form = document.createElement('form');
        form.setAttribute('method', 'post');
        form.setAttribute('action', action);

        Object.keys(params).forEach(key => {
            const input = document.createElement('input');
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', key);
            input.setAttribute('value', this.stringifyValue(params[key]));
            form.appendChild(input);
        });
        return form;
    }
    

    saveOrderDetails(email, name , MOBILE_NO, ORDER_ID, TXN_AMOUNT, menuDetails) {
        // call the API to login the user
    
        const obj = {
            email: email,
            name: name,
            mobileNo: MOBILE_NO,
            orderId: ORDER_ID,
            txnAmount: TXN_AMOUNT,
            menuDetails:menuDetails
            
        }
        axios({
            method: 'POST',
            url: `${API_URL}/api/saveOrderDetails`,
            header: { 'Content-Type': 'application/json' },
            data: obj
        }).then(result => {
          //  debugger
            console.log(result);
        }).catch(error => {
            
            console.log(error);
        });
    }

    //save order details in Using this method
    postTheInfo = (details) => {
       // debugger
        
       // console.log(details.params.EMAIL);
        this.saveOrderDetails(user.email, user.firstName, details.params.MOBILE_NO, details.params.ORDER_ID, details.params.TXN_AMOUNT, menuDetails);


        const form = this.builfForm(details);
        document.body.appendChild(form);
        form.submit();
        form.remove();
    }

    paymentHandler = () => {
        if (this.state.totalPrice == 0) {
            return;
        }
        
        //console.log(user);
        // debugger

        if(User==undefined){
            alert("Please Login First"); 
        }
        
        else{
            user= JSON.parse(User);
            const data = {
                
                amount: this.state.totalPrice,
                email: user.email,
                name: user.firstName,
                mobileNo: '9999999999',
               
            };
            //save transaction details through this--------->>>>
            this.getCheckSum(data)
                .then(result => {
                  //  debugger
                    //console.log('RESULT==== '+ result);
                    let information = {
                        action: "https://securegw-stage.paytm.in/order/process", // URL of paytm server
                        params: result //causing error from server
                    }
                    //console.log("Info : "+information);
                    //debugger
                               
                    this.postTheInfo(information);
                })
                .catch(error => {
                    console.log(error);
                });
        }
    }

    render() {
        const { restaurant, isMenuModalOpen, menu, totalPrice } = this.state;
        User = localStorage.getItem('user')
        
       // console.log(User)       
      //  debugger

        
        return (
            <div className="container py-5">
                {
                    restaurant
                    ?
                    <div>
                        <div className="images mt-5">
                            <Carousel dynamicHeight={false} showThumbs={false} infiniteLoop={true}>
                            { 
                                restaurant.thumb.map((item, index) => {
                                    return (
                                        <div>
                                            <img src={require("../" + item).default} alt="myimage" />
                                        </div>
                                    )
                                })
                            }
                            </Carousel>
                        </div>
                        <div className="restName mt-4 mb-3">
                            { restaurant.name }
                            <button className="btn btn-danger float-end" onClick={this.openMenuHandler}>Place Online Order</button>
                        </div>
                        <div className="mytabs">
                            <Tabs>
                                <TabList>
                                    <Tab>Overview</Tab>
                                    <Tab>Contact</Tab>
                                </TabList>

                                <TabPanel>
                                    <div className="container"> 
                                        <div className="about">About this place</div>
                                        <div className="cuisine">Cuisine</div>
                                        <div className="cuisines mt-1">
                                            {
                                                restaurant.cuisine.map((item, index) => {
                                                    return <span> { item.name }, </span>
                                                })
                                            }
                                        </div>
                                        <div className="cuisine mt-3">Average Cost</div>
                                        <div className="cuisines mt-1">
                                            &#8377; { restaurant.min_price } for two people (approx.)
                                        </div>
                                    </div>
                                </TabPanel>
                                <TabPanel>
                                    <div className="container">
                                        <div className="cuisines my-3">
                                            Phone Number
                                            <div className="text-danger">
                                                { restaurant.contact_number }
                                            </div>
                                        </div>
                                        <div className="cuisine mt-5">{ restaurant.name }</div>
                                        <div className="text-muted">{ restaurant.locality }, { restaurant.city }</div>
                                    </div>
                                </TabPanel>
                            </Tabs>
                        </div>
                        <Modal isOpen={isMenuModalOpen} style={customStyles}>
                            <h3 className="restName">{ restaurant.name }</h3>
                            <button onClick={this.closeMenuHandler} className="btn btn-light closeBtn">Close</button>
                            <ul className="menu">
                                {
                                    menu.map((item, index) => {
                                        for(let i=0;i<menu.length;i++){
                                            quant[i]=0;
                                        }
                                      //  debugger

                                        return <li key={index}>
                                            <div className="row no-gutters menuItem">
                                                <div className="col-10">
                                                    {
                                                        item.isVeg 
                                                        ?
                                                        <div className="text-success">Veg</div>  
                                                        :
                                                        <div className="text-danger">Non-Veg</div> 
                                                    }
                                                    <div className="cuisines">{ item.itemName }</div>
                                                    <div className="cuisines">&#8377;{ item.itemPrice }</div>
                                                    <div className="cuisines item-desc text-muted">{ item.itemDescription }</div>
                                                </div>
                                                <div className="col-2">
                                                    <button className="addButton" onClick={() => this.addItemHnadler(item,restaurant,index)}>+</button>  
                                                                                                 
                                                    <button className="removeButton" onClick={() => this.removeItemHnadler(item,index)}>-</button>
                                                </div>
                                            </div>
                                        </li>
                                    })
                                }
                            </ul>
                            <div className="mt-3 restName fs-4">
                                Subtotal  <span className="m-4">&#8377;{ totalPrice }</span>
                                <button className="btn btn-danger float-end" onClick={this.paymentHandler}>Pay Now</button>
                            </div>
                        </Modal>
                    </div>
                    :
                    <div className="text-dark m-5 p-5 fs-6">Loading...</div>
                }
            </div>
        );
    }
}

export default Details;