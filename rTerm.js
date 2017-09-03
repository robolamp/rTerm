/*
Just a tool for links representation
Needs a JQuery
*/
rTerm = function (options) {
    // A link to JSON with fs and cmd responses
    this.file = options.file;
    // An id of div where to place the terminal
    this.divid = options.div || 'rterm';
    // Username
    this.username = options.username || 'user';
    // Hostname
    this.hostname = options.hostname || 'hostname';
    // Starting path in fs
    this.fsstart = options.fsstart || "/home/" + this.username;
    // High of the terminal
    this.height = options.height || 400;
    // Maximal number of strings
    this.maxStrings = options.maxStrings || 15;
    // Save string to server
    this.saveStrings = options.saveStrings || false;
    // How much time might take to print one character [ms]
    this.chartime = 250;

    this.cdir = this.fsstart;
    this.uhsername = this.username + '@' + this.hostname;


    this.data = {};
    this.clicked = false;

    this.init = function() {
        $.getJSON(this.file, (function(data) {
            this.data = data;
            if (this.data.upstart !== "undefined") {
              this.callUpstart();
            }
        }).bind(this));

        $("#" + this.divid).html(
          '<div id="term"> <span id="termcli">' + this.termPrev +
          '</span><span class="cursor">&#9608</span></div>'
        );

        $(document).keydown(this.keyCallback);
    };

    this.termPrev = '<b>' + this.uhsername + '</b>:~$  '
    this.oldInput = ''
    this.input = '';
    this.nStrings = 0;

    this.callUpstart = function () {
        var delay = 0;
        this.upcid = 0;
        for (var cid in this.data.upstart) {
            if (cid > 0) {
                delay += (this.data.upstart[cid - 1].length + 1) * this.chartime;
            }
            setTimeout(function() {
                this.enterCommand(this.data.upstart[this.upcid]);
                this.upcid++;
            }, delay);
        }
    };

    this.enterCommand = function (command) {
        this.currlid = 0;
        var delays = [];
        for (var lid in command) {
          delays.push(this.chartime * (lid - 0.25 + 0.5 * Math.random()));
        }
        delays[0] = 0;

        for (var lid in command) {
            setTimeout(function() {
                this.addCallback(command[this.currlid]);
                this.currlid++;
            }, this.chartime * lid);
        }
        setTimeout(function() {
            this.enterCallback();
        }, this.chartime * command.length);
    };

    this.updateTerm = function () {
        $("#termcli").html(this.oldInput + this.termPrev + this.input);
        while ($("#term").height() > this.height)
        {
            this.delFristString();
            $("#termcli").html(this.oldInput + this.termPrev + this.input);
        }
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
        if (event.which == 189)
	      {
	         this.addCallback("-");
	      }
        if (event.which == 190)
	      {
	         this.addCallback(".");
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
        else
        {
            if (this.saveStrings)
            {
                this.sendString(this.input);
            }
            var args = this.input.split(" ");
            if (args[0] in this.funcMap)
            {
                this.funcMap[args[0]](args);
            }
            else
            {
                this.unknownCallback();
            }
        }
    }).bind(this);

    this.emptyCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>';
        this.nStrings++;
        this.updateTerm();
    }).bind(this);

    this.unknownCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>' + this.input + ": command not found" + '<br>';
        this.input = '';
        this.nStrings += 2;
        this.updateTerm();
    }).bind(this);

    this.sendString = (function() {
        var xhttp = new XMLHttpRequest();
    }).bind(this);

    this.lsCallback = (function(args) {
        this.oldInput += this.termPrev + this.input + '<br>';
        this.nStrings++;

        var all = false;
        var list = false;

        var dirData = this.data.fs;
        var lsdir = this.cdir;

        for (var arg of args.slice(1)) {
            if (!arg.startsWith("-")) {
                if (arg.startsWith("/")) {
                    lsdir = arg;
                } else {
                    lsdir = lsdir + "/" + arg;
                }
            } else {
                if (arg == "-a") {
                    all = true;
                } else if (arg == "-l") {
                    list = true;
                }
            }
        }
        if (lsdir.endsWith("/")) {
            lsdir = lsdir.slice(0, -1);
        }
        for (var folder of lsdir.split("/").slice(1)) {
            dirData = dirData[folder];
        }
        if (typeof dirData === "undefined") {
            this.oldInput += "ls: cannot access '" + lsdir + "': No such file or directory" + '<br>';
            this.nStrings++;
        } else {
            for (var item in dirData) {
                if (!item.startsWith('.') || all)
                {
                    if (typeof dirData[item] === 'string') {
                        if (dirData[item].startsWith("_link:")) {
                            this.oldInput += '<a class="link" href="' + dirData[item].slice(6, ) + '" target="_blank">' + item + '</a><br>';
                        } else {
                            this.oldInput += item + '<br>';
                        }
                    } else {
                        this.oldInput += '<font color="#729FCF">' + item + '</font><br>';
                    }
                    this.nStrings++;
                }
            }
        }
        this.input = '';
        this.updateTerm();
    }).bind(this);

    this.catCallback = (function(args) {
        var url = '';
        var dstname = args[1];
        var data = this.data.fs;
        if (dstname[0] != "/") {
            dstname = this.cdir + "/" + dstname;
        }
        for (var folder of dstname.split("/").slice(1)) {
            data = data[folder];
        }
        if (data == '' || data === 'undefined') {
            this.oldInput += this.termPrev + this.input + '<br>' + this.input + ": No such file or directory" + '<br>';
        } else {
            if (data.startsWith("_call:")) {
                var args = data.slice(6, ).split(" ");
                if (args[0] in this.funcMap) {
                    this.funcMap[args[0]](args);
                    return;
                } else {
                    this.oldInput += this.termPrev + this.input + '<br>' + data + '<br>';
                }
            } else {
                this.oldInput += this.termPrev + this.input + '<br>' + data + '<br>';
            }
        }

        this.input = '';
        this.nStrings += 2;
        this.updateTerm();
    }).bind(this);

    this.cdCallback = (function(args) {
        var url = '';
        var dstname = args[1];

        for (var item in this.data.main) {
            if (dstname == String(item))
            {
                url = this.data.main[item];
            }
        }
        for (var item in this.data.hidden) {
            if (dstname == String(item))
            {
                url = this.data.hidden[item];
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

    this.pwdCallback = (function(args) {
      this.oldInput += this.termPrev + this.input + '<br>' + this.cdir + '<br>';
      this.input = '';
      this.nStrings += 2;
      this.updateTerm();
    }).bind(this);

    this.whoamiCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>';
        this.nStrings++;

        for (var item of this.data.whoami) {
            this.oldInput += item + '<br>';
            this.nStrings++;
        }
        this.input = '';
        this.updateTerm();
    }).bind(this);

    this.unameCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>' + this.data.uname + '<br>';
        this.input = '';
        this.nStrings += 2;
        this.updateTerm();
    }).bind(this);

    this.randomCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>' + String(Math.random()) + '<br>';
        this.input = '';
        this.nStrings += 2;
        this.updateTerm();
    }).bind(this);

    this.idkCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>';
        this.nStrings++;

        for (var item in this.funcMap) {
            this.oldInput += item + '<br>';
            this.nStrings++;
        }
        this.input = '';
        this.updateTerm();
    }).bind(this);

    this.funcMap = {
        "ls": this.lsCallback,
        "cd": this.cdCallback,
        "cat": this.catCallback,
        "whoami": this.whoamiCallback,
        "uname": this.unameCallback,
        "idk": this.idkCallback,
        "help": this.idkCallback,
        "random": this.randomCallback,
        "pwd": this.pwdCallback
    };

    this.init();
    return this;
}
