/*
WES GDPR popup - coooooookie
*/

class Eu_Cookie{    
    constructor(name, val){
        this.name = name;
        this.scriptLink = "https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js";
        this.val = val;
    }

    get(){
        var self = this;
        return new Promise(function(resolve, reject){
            $.getScript(self.scriptLink).done(function(js){
                resolve(typeof Cookies.get(self.name) !== "undefined");
            });
        });
    }
    
    set(){
        var self = this;
        return new Promise(function(resolve, reject){
            $.getScript(self.scriptLink).done(function(){
                Cookies.set(self.name, self.val);
                resolve();
            });
        });
    }

    toString(){
        return this.name + ", " + this.val;
    }
}

class IpStack{
    constructor(){
        this.url = "http://api.ipstack.com/check";        
        this.params = {access_key : "88de7a4a65b399634e9291d9070aac3f"};
    }

    getInfo(){
        
        var options = $.extend( options || {}, {
            dataType: "jsonp",
            type: "GET",
            url: this.url,
            data: this.params
        });

        return $.ajax(options);
    }
}

/*var IsCookieSet = () => {
    return new Promise(function(resolve, reject){
        $.getScript("https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js")
        .done(function(js){            
            resolve(typeof Cookies.get("_eu_wes") !== "undefined");
        });
    });    
};

var SetCookie = () => {
    return new Promise(function(resolve, reject){
        $.getScript("https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js")
        .done(function(js){
            Cookies.set("_eu_wes", 1);
            resolve();
        });
    });    
};

var InjectScripts = (scripts) => {
    scripts.forEach(element => {
        console.log(element);
        $.getScript("http://localhost/gdpr/" + element);
    });
};*/

// if is europe => getLocation()
// then find a cookie
// if no cookie is found
// then show popup - set cookie on save
// if cookie is found then no popup return false; 

class GDPR{
    constructor(w, e, s, i){
        this.mode = w;
        this.ScriptsToInject = e;
        this.appendTo = s;

        // test
        this.eu = i;
        
        this.checkParams();

        this.modalContentUrl = "https://jsgdps.azurewebsites.net/terms.html";
        this.alertContentUrl = "https://jsgdps.azurewebsites.net/alertText.html";
    }

    Init(){
        var eucookie = new Eu_Cookie("_eu_wes", 1);
        var self = this;
        eucookie.get().then(function(cookieAlreadySet, eucookie){
            if (self.cookieAlreadySet) return;
            
            /* enable the code below when to use api - im disabling because I have site deployed on ssl and http call won't work*/

            /*var ip = new IpStack();
            ip.getInfo().done(function(json){
                if (!json.location.is_eu) {
                    self.injectScripts();
                    return;
                }

                self.showConsent(eucookie);
            });*/
            // if not eu
            if (!self.eu){
                self.injectScripts();
                return;
            }

            self.showConsent(eucookie);
            
        });
    }

    showConsent(eucookie){
        console.log(eucookie.toString());
        var self = this;
        switch(this.mode){
            case "alert":
                $.get(this.alertContentUrl).done(function(text){
                    var newDiv = $('<div/>').addClass("alert alert-info newPrivacyAlert").attr("role","alert").append(text);
                    w.prepend(newDiv);
                    $("#okButton").on("click", function(){ eucookie.set().then(function(){ $(".newPrivacyAlert").hide('slow'); });});
                });
                break;
            case "modal":
                $.get(this.modalContentUrl).done((modal) => {
                    $('body').append(modal);                        
                    $("#savecookie").on('click', function(){
                        console.log(eucookie.toString());
                        eucookie.set().then(function(){
                            $("#myModal").modal('hide');
                            self.injectScripts();
                        });
                    });
                    $("#myModal").modal();
                });
            case "redirect":
                break;
            default: break;
        }
    }

    injectScripts(){
        this.ScriptsToInject.forEach(script => {
            $.getScript("https://jsgdps.azurewebsites.net/" + script);
        });
    }

    checkParams(){
        var allowedParams = ["redirect", "alert", "modal"];

        if (!Array.isArray(this.ScriptsToInject)) return this.throwError("second parameter should be of type array");
        if (this.appendTo instanceof jQuery === false) return this.throwError("3rd parameter must be a jquery selecter object");
        if (allowedParams.indexOf(this.mode) === -1) return this.throwError("Invalid value passed as parameter for init menthod.");
    }

    throwError(msg){
        console.log(msg);
        return false;
    }
}

/*var SetGdprTerms = (function(){
    var allowedParams = ["redirect", "alert", "modal"];

    var init = function (a, s, w){
        if (allowedParams.indexOf(a) === -1) {
            console.log("Invalid value passed as parameter for init menthod.");
            return;
        }

        // init cookie class
        var eucookie = new Eu_Cookie("_eu_wes", 1);

        eucookie.get().then(function(cookieAlreadySet){
            if (cookieAlreadySet) return;

            var ip = new IpStack();
            ip.getInfo().done(function(json){
                if (!json.location.is_eu) {
                    if (s !== null) InjectScripts(s);
                    return;
                }


            });
        });

        IsCookieSet().then(function(r){            
            if (r) return false;

            var url = "http://api.ipstack.com/check";
            var key = "88de7a4a65b399634e9291d9070aac3f";    
            var params = {access_key : key};

            $.ajax({
                url,
                data: params,
                dataType: "jsonp",
                type: "GET"
            }).done(function(json){
                //if (!json.location.ie_eu) return;
                
                //if (!json.location.is_eu) {
                //    InjectScripts(s);
                //    return;
                //}

                if (a === "alert"){
                    $.get("http://localhost/gdpr/alertText.html").done(function(text){
                        //alert("here");
                        var newDiv = $('<div/>').addClass("alert alert-info newPrivacyAlert").attr("role","alert").append(text);
                        w.prepend(newDiv);
                        $("#okButton").on("click", function(){ SetCookie().then(function(){ $(".newPrivacyAlert").hide('slow'); });});
                    });
                }
                else if (a === "modal"){
                    $.get("http://localhost/gdpr/terms.html").done((modal) => {
                        $('body').append(modal);                        
                        $("#savecookie").on('click', function(){
                            SetCookie().then(function(){
                                $("#myModal").modal('hide');
                                InjectScripts(s);
                            });
                        });
                        $("#myModal").modal();
                    });
                }
                else{
                    window.location.replace("http://localhost/gdpr/index1.html");
                }
            });   
        });
    }

    return { init: init }
})();*/
