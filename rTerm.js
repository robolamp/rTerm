/*
Just a tool for links representation
Needs a JQuery
*/
rTerm = function (options) {
    // A link to JSON with links and it's aliases
    this.file = options.file;
    // An id of div where to place the terminal
    this.divid = options.div || 'rterm';
    // username@hostname
    this.uhsername = options.uhsername || 'user@hostname'; 

    this.links = {};

    this.init = function() {
        $.getJSON(this.file, function(data) {
            this.links = data;
        });

        $("#" + this.divid).html('<span>' + this.uhsername + ':~  <span class="blink_cursor"> &#9608 </span></span>');
    };

    this.lsAllCallback = (function() {
        var allItems = {};
        for (var item of this.links.main) {
            console.log(item); 
        }

        for (var item of this.links.hidden) {
            console.log(item);
        }
    }).bind(this);

    this.lsCallback = (function() {
        var allItems = {};
        for (var item of this.links.main) {
            console.log(item); 
        }
    }).bind(this);

    this.init();

    return this;
}


