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
    this.clicked = false;

    this.init = function() {
        $.getJSON(this.file, (function(data) {
            this.links = data;
        }).bind(this));
        
        $("#" + this.divid).html('<div id="term"> <span id="termcli">' +
                                 this.termPrev + '</span><span class="cursor">&#9608</span></div>');

        $("#term").click((function(event) {
            if (!this.clicked)
            {
                $(document).keydown(this.keyCallback);
                this.clicked = true;
            } 
        }).bind(this));
    };

    this.termPrev = this.uhsername + ':~$  '
    this.oldInput = ''
    this.input = '';
    this.nStrings = 0;

    this.updateTerm = function () {
        if (this.nStrings > this.maxStrings)
        {
            while (this.nStrings > this.maxStrings)
            {
                this.delFristString();
            }
        }
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
            this.emptyCallback();
        }
        else if (this.input == "ls")
        {
            this.lsCallback();
        }
        else
        {   
            this.unknownCallback();
        }
    }).bind(this);

    this.emptyCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>';
        this.nStrings++;
        this.updateTerm();
    }).bind(this)

    this.unknownCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>' + this.input + ": command not found" + '<br>';
        this.input = '';
        this.nStrings += 2;
        this.updateTerm();
    }).bind(this);

    this.lsCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>';
        this.nStrings++;

        for (var item in this.links.main) {
            this.oldInput += '<a href="' + this.links.main[item] + '" target="_blank">' + item + '</a><br>';
            this.nStrings++;
        }
        this.input = '';
        this.updateTerm();
    }).bind(this);

    this.init();

    return this;
}


