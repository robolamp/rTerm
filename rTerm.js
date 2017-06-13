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

    this.commands = ["cd", "ls", "cat", "uname", "whoami", "idk"];

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
            event.which == 109 || event.which == 111 ||
            event.which == 32 || event.which == 182)
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
        else if (this.input.indexOf("ls") == 0 && this.input != "ls -a")
        {
            this.lsCallback();
        }
        else if (this.input == "ls -a" || this.input == "ls a")
        {
            this.lsaCallback();
        }
        else if (this.input.indexOf("cd ") == 0)
        {
            this.cdCallback(this.input.substr(3));
        }
        else if (this.input.indexOf("cat ") == 0)
        {
            this.catCallback(this.input.substr(4));
        }
        else if (this.input.indexOf("whoami") == 0)
        {
            this.whoamiCallback();
        }
        else if (this.input.indexOf("uname") == 0)
        {
            this.unameCallback();
        }
        else if (this.input.indexOf("idk") == 0 || this.input.indexOf("help") == 0)
        {
            this.idkCallback();
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
            this.oldInput += '<a class="link" href="' + this.links.main[item] + '" target="_blank">' + item + '</a><br>';
            this.nStrings++;
        }
        this.input = '';
        this.updateTerm();
    }).bind(this);

    this.lsaCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>';
        this.nStrings++;

        for (var item in this.links.main) {
            this.oldInput += '<a class="link" href="' + this.links.main[item] + '" target="_blank">' + item + '</a><br>';
            this.nStrings++;
        }
        for (var item in this.links.hidden) {
            this.oldInput += '<a class="link" href="' + this.links.hidden[item] + '" target="_blank">' + item + '</a><br>';
            this.nStrings++;
        }
        this.input = '';
        this.updateTerm();
    }).bind(this);

    this.catCallback = (function(dstname) {
        var url = '';
        console.log(dstname);

        if (dstname == "/dev/random" || dstname == "/dev/urandom") {
            this.oldInput += this.termPrev + this.input + '<br>' + String(Math.random()) + '<br>';
            this.input = '';
            this.nStrings += 2;
            this.updateTerm();
            return;
        }

        for (var item in this.links.main) {
            if (dstname == String(item)) {
                url = this.links.main[item];
                console.log(url);
            }
        }
        for (var item in this.links.hidden) {
            if (dstname == String(item)) {
                url = this.links.hidden[item];
                console.log(url);
            }
        }
        if (url == '')
        {
            this.oldInput += this.termPrev + this.input + '<br>' + this.input + ": No such file or directory" + '<br>';
            this.input = '';
            this.nStrings += 2;
            this.updateTerm();
            return;
        }

        this.oldInput += this.termPrev + this.input + '<br>' + url + '<br>';
        this.input = '';
        this.nStrings += 2;
        this.updateTerm();
    }).bind(this);

    this.cdCallback = (function(dstname) {
        var url = '';
        console.log(dstname);
        for (var item in this.links.main) {
            if (dstname == String(item))
            {
                url = this.links.main[item];
                console.log(url);
            }
        }
        for (var item in this.links.hidden) {
            if (dstname == String(item))
            {
                url = this.links.hidden[item];
                console.log(url);
            }
        }
        if (url == '')
        {
            this.oldInput += this.termPrev + this.input + '<br>' + this.input + ": No such file or directory" + '<br>';
            this.input = '';
            this.nStrings += 2;
            this.updateTerm();
            return;
        }

        this.oldInput += this.termPrev + this.input + '<br>';
        this.input = '';
        this.nStrings++;
        this.updateTerm();

        window.open(url, '_blank').focus();
    }).bind(this);

    this.whoamiCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>' + this.links.whoami + '<br>';
        this.input = '';
        this.nStrings += 2;
        this.updateTerm();
    }).bind(this);

    this.unameCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>' + this.links.uname + '<br>';
        this.input = '';
        this.nStrings += 2;
        this.updateTerm();
    }).bind(this);

    this.randomCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>' + this.links.uname + '<br>';
        this.input = '';
        this.nStrings += 2;
        this.updateTerm();
    }).bind(this);

    this.idkCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>';
        this.nStrings++;

        for (var item of this.commands) {
            this.oldInput += item + '<br>';
            this.nStrings++;
        }
        this.input = '';
        this.updateTerm();
    }).bind(this);


    this.init();

    return this;
}


