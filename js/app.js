/***
	
	Example backbone.js Shopping Cart

	by @duckbox

	Blog post : http://duckbox/2

**/

/*global jQuery */
/*global _ */
/*global Backbone */


// Generic Namespace for our App
var App = {
		Collection : {},
		Model : {},
		View : {}
	};



// Our Model type
App.Model.Item = Backbone.Model.extend({

	defaults : {
		'price' : 0.99,
		'quantity': 0,
		'total': 0
	},

	// Set and return the total for said model ( price x quantity )
	total : function() {

		var total = this.get('price') * this.get('quantity');
		this.set('total', total);
		return total;

	},

	// Increase or decrease the quantity
	quanity : function( type ) {

		var qty = this.get('quantity');
		this.set('quantity', (type === 'increase' ? ++qty : --qty) );

	}

});



// Define our Collection
App.Collection.Items = Backbone.Collection.extend({

	models: App.Model.Item,

	// Retruns the total amount for all items, using model.total()
	subtotal : function() {
		
		var total = 0;

		this.each(function( model ){
			total += model.total();
		});

		return total.toFixed(2);
	}
});



// View for individual item in the Item list
App.View.Item = Backbone.View.extend({

	// this view is a li element
	tagName: 'li',

	// Get the markup from this id for the views template
	template : $('#tmp-shoppingListItem').html(),

	// Event list
	events: {
		'click' : 'addToCart'
	},

	initialize: function() {
		
		// On init, render
		this.render();

	},

	render: function() {

		// Render the view with the template
		this.$el.html( _.template( this.template, this.model.toJSON() ) );
		return this;

	},

	// Called on view click
	addToCart : function() {

		// Add the model to the Cart view
		App.cart.add( this.model );
	}

});



// View for the List of individual items
App.View.ItemList = Backbone.View.extend({

	el: '#default-item-list',

	initialize: function() {

		// On init, render
		this.render();
	},

	render: function() {

		// collection passed from views arguments
		// Loop through each model in this views collection
		this.collection.each(function( item ){
			
			// Make a new Item view for this model
			var itemView = new App.View.Item({ model: item });

			// Append new Item view into this List View
			this.$el.append( itemView.render().el );

		// Pass the List view context so we can use its $el
		},this);

	}

});



// Individual View for Item inside Shopping Cart
App.View.ShoppingCartItemView = Backbone.View.extend({

	// This view is a tr element
	tagName: 'tr',
	template : $('#tmp-shoppingCartItem').html(),

	events : {
		'click .name' : 'remove',
		'click .quantity' : 'manageQuantity'
	},

	initialize : function() {
		
		this.render();

		// If this models contents change, we re-render
		this.model.on('change', function(){
			this.render();
		}, this);

	},

	render : function() {

		// Render this view and return its context
		this.$el.html( _.template( this.template, this.model.toJSON() ));
		return this;

	},

	// Event for the quantity UI, pass the event
	manageQuantity : function( event ) {

		// Get quantity type from data-type in the element
		var type = $(event.target).data('type');
		
		// If this event is to decrease, and the current quantity is 1
		if( this.model.get('quantity') === 1 && type === 'decrease' ) {
		
			this.remove();
		
		} else {

			// else, increase or decrease the quanity
			this.model.quanity(type);
		}
	},

	remove : function(){

		// Fade out item out from the shopping cart list
		this.$el.fadeOut(500, function(){

			// Remove it from the DOM on completetion
			$(this).remove();

		});
		
		// Remove the model for this view from the Shopping Cart Items collection
		App.cartItems.remove( this.model );
	}

});



// View for the Shopping Cart, container for individual Shopping Cart Item Views
App.View.ShoppingCart = Backbone.View.extend({

	el: '#shopping-list',

	// Some other elements to cache
	total : $('#total'),
	basketTotal : $('#basket'),

	initialize : function(){

		// make a reference to the collection this view dances with
		this.collection = App.cartItems;

		// execute default message for the shopping cart on init
		this.defaultMessage();

		// Listen for events ( add, remove or a change in quantity ) in the collection
		this.collection.on('add remove change:quantity', function( item ){

			// Update the main total based on the new data
			this.updateTotal();

			// If there is no items in the Cart
			if( this.collection.length === 0 ) {
				this.defaultMessage();
			}

		// Pass in this views context
		}, this);

	},

	defaultMessage : function() {

		// Give the view a class of empty, and inject new default content
		this.$el.addClass('empty').html('<tr><td colspan="4">Cart is empty</td></tr>');

	},

	add : function( item ) {

		// Remove .empty class from the view
		this.$el.removeClass('empty');

		// Increase the quanity by 1
		item.quanity('increase');

		// Add the passed item model to the Cart collection
		this.collection.add( item );

		// Render the view
		this.render();

	},

	// Update the totals in the cart
	updateTotal : function() {

		// This is the var for the counter at the top of the page
		var basketTotal = 0;

		// Loop through this collection and addup the number of items
		this.collection.each(function( item ){
			basketTotal += item.get('quantity');
		});

		// Inject these totals
		this.basketTotal.html( basketTotal );
		this.total.html( this.collection.subtotal() );

	},

	render : function(){

		// Empty the view
		this.$el.html('');

		// Loop through the collection
		this.collection.each(function( item ){

			// Render each item model into this List view
			var newItem = new App.View.ShoppingCartItemView({ model : item });
			this.$el.append( newItem.render().el );

		// Pass this list views context
		}, this);

	}

});



// Default Items for our item List.
var defaultItems = [
	{ title: 'Bacon', price: 2.99 },
	{ title: 'Cabbage' },
	{ title: 'Spinnach', price: 1.40 },
	{ title: 'Salt', price: 0.88 },
	{ title: 'Bread' },
	{ title: 'Butter', price : 1.99 }
];

/*
	Define our collections
	----------------------

	App.items : Collection for the models in the item list
	App.cartItems : Collection for the models in the Shopping Cart
*/

App.items = new App.Collection.Items();
App.cartItems = new App.Collection.Items();

// Example of an external listener,
// Execute when a model is added to the cart Items collection
App.cartItems.on('add', function( item ){

	// Make sure this models quantity is set to 1 on adding
	item.set('quantity',1);
	
});

// Setup our models and add all to a collection
for( var i in defaultItems ) {
	App.items.add( new App.Model.Item(defaultItems[i]) );
}

// Define our shopping cart
App.cart = new App.View.ShoppingCart();

//On document ready
$(function(){

	// Start our App by creating the Item List
	App.itemList = new App.View.ItemList({ collection: App.items });

});

