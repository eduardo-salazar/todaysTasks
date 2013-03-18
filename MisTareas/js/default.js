///<reference path="/MobileServicesJavaScriptClient/MobileServices.js" />
// For an introduction to the Navigation template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232506
(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var nav = WinJS.Navigation;
    var taskList = new WinJS.Binding.List();
    var commentList = new WinJS.Binding.List();
    var client = new Microsoft.WindowsAzure.MobileServices.MobileServiceClient(
        "https://todaytasks.azure-mobile.net/",
        "gYuUtqYiFziFetiPqclVzYwhXGmUwT64"
    );
    //--------------facebook------------------
    var userId = null;
    //---------------Notification Channel-------

    var channel;


    
    //--------------facebook------------------
    app.addEventListener("activated", function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            var publicMembers = { TaskList: taskList,Client:client,CommentList:commentList,Channel:channel };
            WinJS.Namespace.define("Datos", publicMembers);

            //facebook
            // Request authentication from Mobile Services using a Facebook login.
            var login = function () {
                return new WinJS.Promise(function (complete) {
                    client.login("facebook").done(function (results) {
                        userId = results.userId;
                        var message = "You are logged with your Facebook account: ";
                        var dialog = new Windows.UI.Popups.MessageDialog(message);
                        dialog.showAsync().done(complete);
                        //cargar task del cloud
                        loadTasks();
                        //cargar comments del cloud
                        loadComments();

                    }, function (error) {
                        userId = null;
                        var dialog = new Windows.UI.Popups
                            .MessageDialog("There is a problem whith the service", "Login Required");
                        dialog.showAsync().done(complete);
                    });
                });
            }


            var authenticate = function () {
                login().then(function () {
                    if (userId === null) {


                        // Authentication failed, try again.
                        authenticate();
                    }
                });


            }


            authenticate();

            //fin fb
           
            if (app.sessionState.history) {
                nav.history = app.sessionState.history;
            }
            args.setPromise(WinJS.UI.processAll().then(function () {
                //Push Notification
                //Get the channel for the application
                var channelOperation = Windows.Networking.PushNotifications.PushNotificationChannelManager
                    .createPushNotificationChannelForApplicationAsync().then(function (newChannel) {
                        Datos.Channel = newChannel;
                    });


                //Agregar evento que escucha cuando se agrega un item a la list
                taskList.addEventListener("iteminserted", addImage, false);
                taskList.addEventListener("itemchanged",addImage,false);
                if (nav.location) {
                    nav.history.current.initialPlaceholder = true;
                    return nav.navigate(nav.location, nav.state);
                } else {
                    return nav.navigate(Application.navigator.home);
                }
            }));
        }
    });
    function loadComments() {
        var commentsTable = client.getTable('Comments').where({usuario:userId});
        var todoItems;
        commentsTable.read().done(function (results) {
            todoItems = new WinJS.Binding.List(results);
            todoItems.forEach(function (item) { Datos.CommentList.push(item); });
        });
    }

    function loadTasks() {
        
        var tasksTable = client.getTable('Tasks').where({usuario:userId});
        var todoItems;
        tasksTable.read().done(function (results) {
            todoItems = new WinJS.Binding.List(results);
            todoItems.forEach(function (item) { Datos.TaskList.push(item); });
        });
    }
     function addImage(args) {
        var item = args.detail.value;
        if (taskList.getAt(args.detail.index).realizada == false) {
            var a=taskList.getAt(args.detail.index);
            a["imagen"]="img/checks/uncheck.png";
        }
        else {
            var a=taskList.getAt(args.detail.index);
            a["imagen"]="img/checks/check.png";
        }
    }

    

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. If you need to 
        // complete an asynchronous operation before your application is 
        // suspended, call args.setPromise().
        app.sessionState.history = nav.history;
    };
    app.onsettings = function (e) {
        e.detail.applicationcommands = { "about": { title: "About ", href: "/about.html" } };
        WinJS.UI.SettingsFlyout.populateSettings(e);
    };
    app.start();
})();
