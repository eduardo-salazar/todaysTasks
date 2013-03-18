(function () {
    "use strict";
    var target = "";
    
    function showAppBar(currentItem) {
        // Get the app bar.
        var element = document.activeElement;
        var appbar = document.getElementById("appbar");

        // Keep the app bar open after it's shown.
        appbar.winControl.sticky = true;

        // Set the app bar context.
        showItemCommands();

        // Show the app bar.
        appbar.winControl.show();

        // Return focus to the original item which invoked the app bar.
        if (element != null) element.focus();
    }

    function hideAppBar() {
        var element = document.activeElement;
        var appbar = document.getElementById("appbar");
        appbar.winControl.sticky = false;
        appbar.winControl.hide();
        hideItemCommands();
        if (element != null) element.focus();
    }
    function showItemCommands() {
        appbar.winControl.showCommands([cmdDelete]);
    }

    function hideItemCommands() {
        appbar.winControl.hideCommands([cmdDelete]);
    }
    WinJS.UI.Pages.define("/pages/home/home.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            // TODO: Initialize the page here.
            
            //Agregar tarea
            var btnAdd = document.getElementById("addButton");
            btnAdd.addEventListener("click", this.addTask, false);
            //cambiar estado de tarea
            var btncheck = document.getElementById("taskList");
            btncheck.addEventListener("click", this.changeState, false);
            btncheck.addEventListener("iteminvoked", this.changeIndex, false);
            btncheck.addEventListener("selectionchanged", this.showAppBarDelete, false);
            //Evento save panel summary
            var summary = document.getElementById("btnSave");
            summary.addEventListener("click",this.updateTask,false);
       
            //Ocurtar boton delete del appbar
            hideAppBar();
            //handler del evento click de delete
            var cmdDelete = document.getElementById("cmdDelete");
            cmdDelete.addEventListener("click",this.deleteItems,false);

            //handler para agregar comentario
            var btnAddComment = document.getElementById("btnAddComment");
            btnAddComment.addEventListener("click", this.addComment, false);
            //handler para activar el appbar
            var commentList = document.getElementById("commentsList");
            commentList.addEventListener("selectionchanged", this.showAppBarDelete, false);

            //facebook login
        },
        addComment: function (info) {
            var comment =
                {
                    comentario: document.getElementById("commentInput").value,
                    usuario: "",
                    channel:Datos.Channel.uri
                };
            //Agregar al cloud
            Datos.Client.getTable("Comments").insert(comment);
            //Agregar a la lista
            Datos.CommentList.push(comment);
        },
        deleteItems:function(info){
            //Borrar items
            var items = document.getElementById("taskList");
            var comments = document.getElementById("commentsList");

            //funcion para borrar del cloud
            var borrarCloudTasks = function (value) {
                Datos.Client.getTable("Tasks").del(Datos.TaskList.getAt(value));
            };
            var borrarListTasks = function (key) {
                //borrar de la lista
                var index = Datos.TaskList.indexOfKey(key);
                Datos.TaskList.splice(index, 1);
            };
            if (items.winControl.selection.getItems()._value.length != 0) {                
                var indexes = items.winControl.selection.getIndices();
                indexes.forEach(borrarCloudTasks);
                var keys=new WinJS.Binding.List();
                indexes.forEach(function (index) {
                    keys.push(Datos.TaskList.getItem(index).key);
                });
                
                keys.forEach(borrarListTasks);
            }
            //funcion para borrar del cloud
            var borrarCloudComments = function (value) {
                Datos.Client.getTable("Comments").del(Datos.CommentList.getAt(value));
            };
            var borrarListComments = function (key) {
                //borrar de la lista
                var index = Datos.CommentList.indexOfKey(key);
                Datos.CommentList.splice(index, 1);
            };
            if (comments.winControl.selection.getItems()._value.length != 0) {
                var indexes = comments.winControl.selection.getIndices();
                indexes.forEach(borrarCloudComments);
                var keys = new WinJS.Binding.List();
                indexes.forEach(function (index) {
                    keys.push(Datos.CommentList.getItem(index).key);
                });

                keys.forEach(borrarListComments);
            }
            //if (comments.selection.getItems()._value.length != 0) {
            //    var selectedComments = comments.selection.getItems();
            //    var index2;
            //    for (var j = 0; j < selectedComments._value.length; j++) {
            //        //Borrar de la nube
            //        index2 = selectedComments._value[j].index;
            //        Datos.Client.getTable("Comments").del(Datos.CommentList.getAt(index2));

            //        //borrar de la lista
            //        Datos.CommentList.splice(index2, 1);
            //    }
            //}
        },
        showAppBarDelete: function (info) {
            var btncheck = document.getElementById("taskList").winControl;
            var comments = document.getElementById("commentsList").winControl;
            //Visualizar appbar delete
            if (btncheck.selection.count() == 0 && comments.selection.count()==0) {
                hideAppBar();
            }
            else {
                showAppBar();
            }
        },
        updateTask:function(infoData){
            //Obtener descripcion y fecha
            var descripcion=document.getElementById("description").value;
            var date=document.getElementById("date").winControl.current;
            //Asignar valores al elemento seleccionado de la lista
            Datos.TaskList.getAt(target).descripcion=descripcion;
            Datos.TaskList.getAt(target).fecha=date.toDateString();
            //Actualizar elemento en el cloud
            Datos.Client.getTable("Tasks").update(Datos.TaskList.getAt(target));
            //Notificar al listView que hay que actualizar
            Datos.TaskList.notifyReload();
        },
        changeState: function (infoData) {
           if (infoData.target.localName == "img") {
                if (Datos.TaskList.getAt(target).realizada == false) {
                    Datos.TaskList.getAt(target).realizada = true;
                    Datos.TaskList.getAt(target).imagen = "img/checks/check.png";
                }
                else {
                    Datos.TaskList.getAt(target).realizada = false;
                    Datos.TaskList.getAt(target).imagen = "img/checks/uncheck.png";
                }
                Datos.TaskList.notifyReload();
               //actualizar cloud
                Datos.Client.getTable("Tasks").update(Datos.TaskList.getAt(target));
            }
        },
        changeIndex: function (e) {
            target = e.detail.itemIndex;

            var description = document.getElementById("description");
            var date = document.getElementById("date").winControl;
            description.value = Datos.TaskList.getAt(target).descripcion;
            date.current = Datos.TaskList.getAt(target).fecha;
        }
        ,
        addTask: function (infoData) {
            var fecha=new Date();
            //Obtener titulo de la tarea
            var input = document.getElementById("newTaskInput");
            var task = 
                {
                    titulo: input.value,
                    descripcion: "",
                    fecha: fecha.toDateString(),
                    usuario: "",
                    realizada: false,
                    channel:Datos.Channel.uri
                };
            //Agregar al windows azure
            Datos.Client.getTable("Tasks").insert(task);
            Datos.TaskList.push(task);

            //limpiar input
            input.value = "";
        }
    });
})();
