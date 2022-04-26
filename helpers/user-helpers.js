var db=require('../config/connection');
var collection=require('../config/collections');
const bcrypt=require('bcrypt');
var ObjectId=require('mongodb').ObjectId
const { cart_collection } = require('../config/collections');

module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password= await bcrypt.hash(userData.Password,10)
            db.get().collection(collection.user_collection).insertOne(userData).then((data)=>{
                resolve(data)
            })
        })
        
    },
    doLogin:(userData)=>{
        return new Promise(async (resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collection.user_collection).findOne({Email:userData.Email})
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        console.log("login success");
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{
                        console.log("login failed");
                        resolve({status:false})
                    }
                
                })
            }else{
                console.log("login failed"); 
                resolve({status:false})   
            }
        })
    },
    addToCart:(prodId,userId)=>{
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.cart_collection).findOne({user:ObjectId(userId)})
            if(userCart){
                db.get().collection(collection.cart_collection).updateOne(
                    {user:ObjectId(userId)},
                    {$set:{
                            $push:{products:ObjectId(prodId)}
                        }
                    }).then((response)=>{
                        resolve()
                    })
                    

            }else{
                let cartObj={
                    user:ObjectId(userId),
                    products:[ObjectId(prodId)]
                }
                db.get().collection(collection.cart_collection).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })

    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems= await db.get().collection(collection.cart_collection).aggregate([
                {
                    $match:{user:ObjectId(userId)}
                },
                {
                    $lookup:{ 
                        from:collecction.product_collection,
                        let:{prodList:'products'},
                        pipeline:[
                            {
                                $match:{
                                    $expr:{
                                        $in:['$_id',"$$prodList"]
                                    }
                                }
                            }
                        ],
                        as:'cartItems'
                    }
                }
            ]).toArray()
            resolve(cartItems[0].cartItems)
        })
    }
}