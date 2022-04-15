// Node + Express
// Configuration
const express = require("express");
const bodyParser = require("body-parser");
const lodash = require("lodash");
const app = express();
// MongoDB
const mongoose = require("mongoose");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = {
  name: String,
};
const Item = mongoose.model("Item", itemsSchema);
const welcome = new Item({
  name: "Welcome to your todo-list",
});
const removeItem = new Item({
  name: "<-- Hit this to remove an item",
});
const defaultItems = [welcome, removeItem];
const ListSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("List", ListSchema);
// Home route
app.get("/", (req, res) => {
  // Finding items from db
  Item.find({}, (err, items) => {
    if (err) {
      console.log(err);
    } else {
      if (items.length === 0) {
        // Inserts default items when items is empty
        Item.insertMany(defaultItems, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully Saved to DB.");
          }
        });
        res.redirect("/");
      } else {
        res.render("index", { listTitle: "Today", newItem: items });
      }
    }
  });
});

app.post("/", (req, res) => {
  let newItem = req.body.newItem;
  let newList = req.body.listType;
  const newTodoItem = new Item({
    name: newItem,
  });
  if (newList === "Today") {
    newTodoItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: newList }, (err, Foundlist) => {
      if (err) {
        console.log(err);
      } else {
        Foundlist.items.push(newTodoItem);
        Foundlist.save();
        res.redirect("/" + newList);
      }
    });
  }
});
// About Route
app.get("/about", (req, res) => {
  res.render("about");
});
// Delete Route
app.post("/delete", (req, res) => {
  const deletedItem = req.body.checkbox;
  let listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndDelete({ _id: deletedItem }, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Item successfully Deleted.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: deletedItem } } },
      (err, Foundlist) => {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/" + listName);
        }
      }
    );
  }
});
// Custom Route
app.get("/:customRoute", (req, res) => {
  const customRoute = lodash.capitalize(req.params.customRoute);
  List.findOne({ name: customRoute }, (err, Foundlist) => {
    if (!err) {
      if (!Foundlist) {
        // Creates new list
        const list = new List({
          name: customRoute,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customRoute);
      } else {
        // Uses existing List
        res.render("index", {
          listTitle: Foundlist.name,
          newItem: Foundlist.items,
        });
      }
    }
  });
});

// App Listener
app.listen(process.env.PORT || 8080, () => {
  console.log("Server started on port 8080");
});
