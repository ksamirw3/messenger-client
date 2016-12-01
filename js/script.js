'use strict';
var app = angular.module('mgr', []);
app.value('appSettings', {
    api: 'http://localhost:3000/',
    version: '1.0'
});

// chat controller
(function () {
    var controller = function ($scope, service) {

        $scope.me = null;
        $scope.selected_user = null;
        $scope.users_list = null;

        service.getUsers().then(function (response) {
            var res = response.data;
            if (res.error) {
                console.log(res.error);
                return false;
            }
            $scope.users_list = res
        });

        var socket = io.connect('http://localhost:3000');
        $scope.msgs = [];



        $scope.$on('userLogged', function (event, data) {
//                console.log('userLogged', data);
            $scope.me = data;
            socket.emit('userLogin', data.id);
        });

        socket.on('userConnected', function (user) {
//            if ($scope.me == null) {
//                $scope.me = user;
//            }
//        console.log('userConnected:', user);

            for (var i in $scope.users_list) {
                if ($scope.users_list[i].id == user.id) {
                    $scope.users_list[i] = user;
                    break;
                }
            }

            if ($scope.selected_user && $scope.selected_user.id == user.id) {
                $scope.selected_user = user;
            }

            if ($scope.me && $scope.me.id == user.id) {
                $scope.me = user;
            }
//            console.log($scope.me);

            $scope.$apply();

        });

        //function to send messages.
        $scope.send_msg = function ($event) {
            var keyCode = $event.which || $event.keyCode;

            if (!$scope.selected_user && keyCode === 13) {
                alert("Please select user.");
                return false;
            }

            if ($scope.selected_user.id == $scope.me.id) {
                alert("You can't send mmsg to your self.");
            } else {
                if (keyCode === 13) {
                    var data_server = {
                        to: $scope.selected_user,
                        msg: $scope.msg_text,
                        from: $scope.me
                    };
                    $scope.msgs.push(data_server);
//                console.log('send_msg', data_server);
                    $scope.msg_text = '';
                    socket.emit('send_msg', data_server);
                }
            }
        };

        //to highlight selected row
        $scope.clicked_highlight = function (id) {

            for (var i in $scope.users_list) {
                if ($scope.users_list[i].id == id) {
                    $scope.selected_user = $scope.users_list[i];
//                    console.log($scope.selected_user);
                    break;
                }
            }
        };

        //on exit updating the List od users
        socket.on('exit', function (socket_id) {
//        console.log('exit:', socket_id);
            for (var i in $scope.users_list) {
                if ($scope.users_list[i].socket == socket_id) {
                    $scope.users_list[i].socket = null;
                    break;
                }
            }


            $scope.$apply();
        });

        //displaying the messages.
        socket.on('get msg', function (data) {
//        console.log('get msg', data);
            $scope.msgs.push(data);
            $scope.$apply();
        });

    };
    controller.$inject = ['$scope', 'service'];
    app.controller('chatCtrl', controller);
}());

// login controller
(function () {
    var controller = function ($scope, $rootScope, service, helper) {

        $scope.user = {
            username: '',
            password: ''
        }

        $scope.doLogin = function () {

            service.login($scope.user).then(function (response) {
                var res = response.data;
                if (res.error) {
                    helper.setMessage(res.msg);
                    return false;
                }
                service.setUser(res.data);
                $rootScope.$broadcast('userLogged', res.data);
//                console.log('doLogin', service.getUser());

            })

        }

        $scope.$on('userLogged', function (event, data) {
            $scope.me = data;
        });

    };
    controller.$inject = ['$scope', '$rootScope', 'service', 'helper'];
    app.controller('loginCtrl', controller);
}());

// user service
(function () {
    var factory = function ($http, helper) {

        var service = {
            user: null,
        }

        var response = {
            login: function (user) {
                return $http.post(helper.getSetting('api') + 'login', user);
            },
            getUsers: function () {
                return $http.get(helper.getSetting('api') + 'users-list');
            },
            setUser: function (val) {
                service.user = val;
            },
            getUser: function () {
                return service.user;
            }
        };


        return response;
    };
    factory.$inject = ['$http', 'helper'];
    app.factory('service', factory);
}());

// helper service
(function () {
    var factory = function (appSettings) {



        var response = {
            getSetting: function (key) {
                return appSettings[key];
            },
            setMessage: function (msg) {
                return alert(msg);
            }
        };
        return response;
    };

    factory.$inject = ['appSettings'];
    app.factory('helper', factory);
}());