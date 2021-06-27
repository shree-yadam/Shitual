/*
 * All routes for Customers are defined here
 * Since this file is loaded in server.js into api/customers,
 *   these routes are mounted onto /customers
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */
const bcrypt = require('bcrypt');
// const restaurantDb = require('../lib/database/restaurant_queries');
//TBD :HARD CODED RESTAURANT ID TO BEGIN
const RESTAURANT_ID = 1;

module.exports = (router, db) => {

  router.get("/login_register/", (req, res) => {
    if (req.session.customerId) {
      res.redirect("/api/menu");
      return;
    }
    // TBD RENDER LOGIN PAGE
    // res.render("customer_login");
    //Display customer login form
    let customerId = req.session.customerId;
    const templateVars = {
      customerId
    };
    res.render("login_register_form", templateVars);
  });

  //TBD Remove if not needed
  // router.get("/register/", (req, res) => {
  //   //display customer registration form
  //   res.send("customer registration form");
  // });

  //TBD:: STRETCH Customer can edit order using link provided as long as status is requested
  router.get("/:id/order/:order_id", (req, res) => {
    //Get order_id belonging to customer #id
    let customerId = req.session.customerId;
    const order_id = req.params.order_id;
    db.getOrderFromId(order_id)
      .then(order => {
        const total_price = order.total_price;
        const customerId = order.customer_id;
        const order_id = order.id;
        const templateVars = {
          customerId,
          order_id,
          total_price
        };
        res.render("order_placed", templateVars);
      })
  });

  router.post("/login/", (req, res) => {
    //Verify customer login information and display order placement form
    const { email, password } = req.body;
    db.getCustomerWithEmail(email)
      .then(customer => {
        if (!customer || !bcrypt.compareSync(password, customer.password)) {
          res
            .status(403)
            .send("Invalid credentials!!");
          return;
        }
        req.session.customerId = customer.id;
        res.redirect("/");
      })
      .catch(e => {
        console.error(e);
        res.send(e);
      });
  });

  router.post("/register/", (req, res) => {
    //Add customer details to DB and display order menu
    res.send("customer registration form submitted");
  });

  router.post("/logout/", (req, res) => {
    //TBD Check Functionality
    req.session = null;
    res.redirect("/");
  });

  router.post("/:id/order", (req, res) => {
    //Post order for customer #id
    const itemIds = req.body.itemId;
    const quantities = req.body.quantity;
    if (!itemIds) {
      res.send("InvalidEntry");
      return;
    }
    db.createOrderForCustomerForRestaurant(req.session.customerId, RESTAURANT_ID, itemIds, quantities)
      .then(orders => {
        const customerId = req.session.customerId;
        db.updateTotalPriceForOrder(orders[0].order_id)
          .then(order => {
            res.redirect(`/api/customers/${customerId}/order/${order.id}`);
          })
          .catch(e => {
            console.error(e);
            console.log("ORDER CREATE FAILURE");
          });
      })
      .catch(e => {
        console.error(e);
        console.log("ORDER CREATE FAILURE");
        res.send(e);
      });
  });
  return router;
};
