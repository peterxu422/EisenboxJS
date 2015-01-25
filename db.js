// Javascript module. Global module named 'todoDb'
// http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
var todoDB = (function() {
	var tDB = {}; // Stores the methods in the module that will be accessible from outside the scope of module
	var datastore = null; // Stores reference to the database. Cannot be referenced outside of module

	// TODO: Add methods for interacting with the database here.
		
	/*
	 Open a connection to the datastore
	 */
	tDB.open = function(callback) {
		// Database version
		var version = 1;

		// Open a connection to the datastore. 
		/* 
			open() returns IDBOpenRequest object with a result (success) or error value.
			Most other async funcs in IndexedDB do the same. Return IDBRequest w/ the result or error
			The result for the open() is an instance of IDBDatabase

			The version determines the database schema.
		*/
		var request = indexedDB.open('todos', version);

		// Handle datastore upgrades.
		/*
			onupgradeneeded event is triggered if the database doesn't already exist or updating the version.
			IDBVersionChangeEvent Object passed to handler
			The function to the right of the event is the event handler.
			onupgradeneeded is the only place where you can alter the structure of the database
		*/
		request.onupgradeneeded = function(e) {
			var db = e.target.result; // Reference to the database 

			e.target.transaction.onerror = tDB.onerror;


			// Check to see if the object store exists. Delete the old datastore.
			
			if(db.objectStoreNames.contains("todo")) {
				db.deleteObjectStore("todo");
			}

			// Create a new datastore.
			// Specifying a keyPath is kind of like specifying a field
			var store = db.createObjectStore("todo", {
				keyPath: 'timestamp'
			});
		};

		// Handle successful datastore access.
		request.onsuccess = function(e) {
			// Get a reference to the DB.
			datastore = e.target.result;

			// Execute the callback. In this case, refreshTodos()
			callback();
		};

		// Handle errors when opening the datastore.
		// Opening IndexDB in incognito mode will fail
		request.onerror = tDB.onerror;
	};

	/*
		Fetch all of the todo items in the datastore
	*/
	tDB.fetchTodos = function(callback) {
		/*
			You need to start a transaction to do anything with your db.
			Transactions come from the db object and you need to specify which object stores you want the trxn to span
		*/
		var db = datastore;
		var transaction = db.transaction(['todo'], 'readwrite'); // This transaction handles the interaction with the database. Returns a transaction object
		var objStore = transaction.objectStore('todo'); // Reference to the todo object store

		var keyRange = IDBKeyRange.lowerBound(0); // Specify range of items in object store to retrieve. Get all items so set lower bound of range to 0 (selects all from 0 and up)
		var cursorRequest = objStore.openCursor(keyRange); // Cursor to cycle thru each todo item in database

		var todos = [];

		transaction.oncomplete = function(e) {
			// Execute the callback function once all items fetched
			callback(todos);
		};
		
		cursorRequest.onsuccess = function(e) {
			// The cursor object has the key and value properties
			var result = e.target.result;
			if(!!result == false) {
				return;
			}

			todos.push(result.value);
			result.continue(); // Moves cursor to next item in the database
		};

		cursorRequest.onerror = tDB.onerror;
	};

	/*
		Create a new todo item
	*/
	tDB.createTodo = function(text, quad, callback) {
		// Get a reference to the db
		var db = datastore;

		// Initiate a new transaction
		var transaction = db.transaction(['todo'], 'readwrite');

		// Get the datastore
		var objStore = transaction.objectStore('todo');

		// Create a timestamp to be the key for the todo item.
		var timestamp = new Date().getTime();

		// Create an object for the todo item.
		var todo = {
			'text': text,
			'quadrant': quad,
			'timestamp': timestamp,
			'done_timestamp' : 0
		};

		// Create the datastore request. add() requires no same obj already in db. put() doesn't care if it already exists
		var request = objStore.put(todo);

		// Handle a successful datastore put
		request.onsuccess = function(e) {
			// Execute the callback function
			callback(todo);
		};

		// Handle errors
		request.onerror = tDB.onerror;
	};

	/*
		Delete a todo item
	*/
	tDB.deleteTodo = function(id, callback) {
		var db = datastore;
		var transaction = db.transaction(['todo'], 'readwrite');
		var objStore = transaction.objectStore('todo');

		var request = objStore.delete(id);
		console.log("here");
		//debugger
		request.onsuccess = function(e) {

			callback();
		}

		request.onerror = function(e) {
			console.log(e);
		}
	};

	tDB.completeTodo = function(id, callback) {
		var db = datastore;
		var transaction = db.transaction(['todo'], 'readwrite');
		var objStore = transaction.objectStore('todo');

		var getRequest = objStore.get(id);

		getRequest.onsuccess = function(e) {
			var todo = e.target.result;
			var timestamp = new Date().getTime();
			todo.done_timestamp = timestamp;

			var reqUpdate = objStore.put(todo);

			reqUpdate.onsuccess = function(e) {
				callback();
			}

			reqUpdate.onerror = function(e) {
				console.log(e);
			}
		}

		getRequest.onerror = function(e) {
			console.log(e);
		}
	};

	tDB.updateTodo = function(todo, callback) {
		var db = datastore;
		var transaction = db.transaction(['todo'], 'readwrite');
		var objStore = transaction.objectStore('todo');

		var request = objStore.put(todo);

		request.onsuccess = function(e) {
			callback();
		}

		request.onerror = function(e) {
			console.log(e);
		}

	};

	tDB.updateText = function(id, text, callback) {
		var db = datastore;
		var transaction = db.transaction(['todo'], 'readwrite');
		var objStore = transaction.objectStore('todo');

		var getRequest = objStore.get(id);

		getRequest.onsuccess = function(e) {
			var todo = e.target.result;
			todo.text = text;

			var reqUpdate = objStore.put(todo);

			reqUpdate.onsuccess = function(e) {
				callback();
			}

			reqUpdate.onerror = function(e) {
				console.log(e);
			}
		}

		getRequest.onerror = function(e) {
			console.log(e);
		}
	};

	tDB.changeQuad = function(id, quad, callback) {
		var db = datastore;
		var transaction = db.transaction(['todo'], 'readwrite');
		var objStore = transaction.objectStore('todo');
		
		var getRequest = objStore.get(id);

		getRequest.onsuccess = function(e) {
			var todo = e.target.result;
			todo.quadrant = quad;

			var reqUpdate = objStore.put(todo);

			reqUpdate.onsuccess = function(e) {
				callback();
			}

			reqUpdate.onerror = function(e) {
				console.log(e);
			}
		}

		getRequest.onerror = function(e) {
			console.log(e);
		}
	};

	// Export the tDB object. This declares the global module
	return tDB;
}());