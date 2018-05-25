/*
WES GDPR consent popup.
*/

class wes_cookie{
    constructor(name){
        this.name = name;
        this.val = 1;
        this.exp = 1825;
        this.domain = ".wes.org";
        this.scriptLink = "https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js";
    }

    get(){
        var _this = this;
        return new Promise(function(resolve, reject){
            $.getScript(_this.scriptLink).done(function(js){
                resolve(Cookies.get(_this.name));
            });
        });
    }

    isCookieSet() {
        return this.get().then((cookie) => typeof cookie !== "undefined");
    }

    set(){
        var _this = this;
        return new Promise(function(resolve, reject){
            $.getScript(_this.scriptLink).done(function(){
                Cookies.set(_this.name, _this.val, { expires: _this.exp, domain: _this.domain });
                resolve();
            });
        });
    }

    toString(){
        return this.name + ", " + this.val;
    }
}

var Ip = {
    getInfo : function() {
        var options = $.extend( options || {}, {
            dataType: "jsonp",
            type: "GET",
            url: "https://api.ipstack.com/check",
            data: { access_key : "91470bf648eedda2b1f664aee50db435" }
        });
        return $.ajax(options);
    }
}

class user_consent{
    constructor(options){
        if (typeof options !== "object") this.throwError("Invalid parameter");

        this.mode = "modal";
        this.ScriptsToInject = options.js;
        this.appendTo = options.el.name;        

        this.cookie_eu = new wes_cookie("_eu_wes");
        this.cookie_ip = new wes_cookie("_eu_ip");        
        
        this.checkParams();

        this.modalContentUrl = this.getModalContent();
        this.alertContentUrl = this.getAlertContent();
    }

    init(){
        this.cookie_eu.isCookieSet().then((consentCookieSet) => {
            if (consentCookieSet) {
                this.injectScripts();
                return;
            }

            // if eu

            // else


            this.isEu()
                .then((isEu)=>{
                    if (isEu){
                        this.showConsent();
                        return;
                    }
                    else{
                        this.mode = "alert";
                        this.injectScripts();
                    }                    
                })
                .fail(()=>{
                    this.mode = "alert";
                    this.injectScripts();
                })            
        });
    }

    isEu(){        
        var _this = this;
        return new Promise(function(resolve, reject){
            // first check if cookie is set for eu customer
            // val 0 => non eu | val 1 => eu
            _this.cookie_ip.isCookieSet().then((cookieSet) => {
                if (!cookieSet){
                    try {
                        console.log("calling ip stack");
                        Ip.getInfo().done((json) => {
                            if (!json.location.is_eu) _this.cookie_ip.set().then(resolve(false));
                            else resolve(true);
                        });
                    }
                    catch(error) {                        
                        // if any error due to api not reachable etc... we'd default to non eu behavior
                        reject("ip stack unreachable: "+ error);
                    }
                }
                else resolve(false);
            });
        });
    }
    
    showConsent(){        
        switch(this.mode){
            case "alert":
                $.get(this.alertContentUrl).done((text)=>{
                    var newDiv = $('<div/>').addClass("alert alert-info newPrivacyAlert").attr("role","alert").append(text);
                    this.appendTo.prepend(newDiv);
                    this.setButtons();
                });
                break;
            case "modal":
                $.get(this.modalContentUrl).done((modal) => {
                    this.appendTo.prepend(modal); 
                    $("#myModal").modal({backdrop: 'static', keyboard: false});
                    this.setButtons();
                });
            case "redirect":
                break;
            default: break;
        }
    }

    setButtons(){
        var _this = this;

        var path = "https://www.wes.org/";
        if (window.location.href.indexOf("/ca/") !== -1){
            path += "ca/";
        }

        $("#pp").attr("href", path + "privacy-policy/");
        $("#cc").attr("href", path + "cookie-policy/");

        $("#btnIAccept").on("click", function(){ 
            _this.cookie_eu.set(null).then(function(){
                if (_this.mode === "alert"){
                    $(".newPrivacyAlert").hide('slow'); 
                }
                else{
                    $("#myModal").modal('hide');
                    _this.injectScripts();
                }                
            });
        });
    }
    
    getModalContent(){
        return "https://" + window.location.hostname + "/terms.html";
    }

    getAlertContent(){        
        return "https://" + window.location.hostname + "/alertText.html";
    }    

    injectScripts(){        
        this.ScriptsToInject.forEach(script => {
            $.getScript("https://applications.wes.org/js/" + script);		
        });
    }

    checkParams(){
        if (!Array.isArray(this.ScriptsToInject)) this.throwError("js must be an array of js scripts.");
        if (this.appendTo instanceof jQuery === false) this.throwError("appendTo must be a jquery selecter object");        
    }

    throwError(msg){
        throw msg;
    }
}