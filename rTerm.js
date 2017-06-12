/*
Just a tool for links representation
Needs a JQuery
*/
rTerm = function (options) {
    // A link to JSON with links and it's aliases
    this.file = options.file;
    // An id of div where to place the terminal
    this.divid = options.div || 'rterm';
    // Username@hostname
    this.uhsername = options.uhsername || 'user@hostname'; 
    // Width of the terminal
    this.width = options.width || '600';
    // Maximal number of strings
    this.maxStrings = options.maxStrings || 15;

    this.links = {};

    this.init = function() {
        $.getJSON(this.file, function(data) {
            this.links = data;
        });
        
        $("#" + this.divid).html('<div id="term"> <span id="termcli">' +
                                 this.termPrev + '</span><span class="cursor">&#9608</span></div>');

        $("#term").click((function(event) {
            $(document).keydown(this.keyCallback);
        }).bind(this));
    };

    this.termPrev = this.uhsername + ':~$  '
    this.oldInput = ''
    this.input = '';
    this.nStrings = 0;

    this.addStringToTerm = function () {
        this.nStrings += 2;
        if (this.nStrings > this.maxStrings)
        {
            this.delFristString();
            this.delFristString();
        }
        $("#termcli").html(this.oldInput + this.termPrev + this.input);
    };

    this.updateTerm = function () {
        $("#termcli").html(this.oldInput + this.termPrev + this.input);
    };

    this.delFristString = function () {
        var cutPos = this.oldInput.indexOf("<br>");
        this.oldInput = this.oldInput.slice(cutPos + 4, -4) + '<br>';
        this.nStrings--;
    };

    this.keyCallback = (function(event) {
        if ((event.which >= 48 && event.which <= 90) || 
            (event.which >= 96 && event.which <= 107) ||
            event.which == 109 || event.which == 111)
        {
            this.addCallback(event.key);
        }
        if (event.which == 8 || event.which == 46 || event.which == 110)
        {
            this.delCallback();
        }
        if (event.which == 13)
        {
            this.enterCallback();
        }
    }).bind(this);

    this.addCallback = (function (key) {
        this.input += key;
        this.updateTerm();
    }).bind(this);

    this.delCallback = (function () {
        this.input = this.input.slice(0, -1);
        this.updateTerm();
    }).bind(this);

    this.enterCallback = (function () {

        if (this.input == '')
        {
            this.oldInput += this.termPrev + this.input + '<br>';
            this.addStringToTerm();
        }
        else
        {
            var output = this.unknownCallback();

            this.oldInput += this.termPrev + this.input + '<br>' + output + '<br>';
            this.input = '';
            this.addStringToTerm();
        }
    }).bind(this);

    this.unknownCallback = (function() {
        return this.input + ": command not found";
    }).bind(this);

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


