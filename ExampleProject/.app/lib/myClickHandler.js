"use strict";
var MyClickHandler = (function () {
    function MyClickHandler() {
    }
    MyClickHandler.prototype.HandleClick = function (name) {
        alert('Hello ' + name);
    };
    return MyClickHandler;
}());
exports.MyClickHandler = MyClickHandler;
