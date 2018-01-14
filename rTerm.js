/*
 * Just a tool for links representation
 * Needs a JQuery
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
    // Logger app port
    this.loggerAppPort = options.loggerAppPort || 9091;
    // How much time might take to print one character [ms]
    this.chartime = 250;
    // Current dirrectory
    this.cdir = this.fsstart;
    this.uhsername = this.username + '@' + this.hostname;

    this.data = {};
    this.clicked = false;

    // Load data, call upstart commands and set callbacks
    this.init = function() {
        $.getJSON(this.file, (function(data) {
            this.data = data;

            window.onblur = function() {
                window.blurred = true;
            };
            window.onfocus = function() {
                window.blurred = false;
            };

            if (this.data.upstart !== "undefined") {
                var delay = this.callUpstart();

                setTimeout(function() {
                    $(document).keydown(this.keyCallback);
                }, delay);
            } else {
                $(document).keydown(this.keyCallback);
            }
        }).bind(this));

        $("#" + this.divid).html(
          '<div id="term"> <span id="termcli">' + this.termPrev +
          '</span><span class="cursor">&#9608</span></div>'
        );
    };

    this.termPrev = '<b>' + this.uhsername + '</b>:~$  '
    this.oldInput = ''
    this.input = '';
    this.nStrings = 0;

    // Call initial commands from data.upstart with typing delays
    this.callUpstart = function () {
        var delay = 0;
        this.upcid = 0;
        this.upstartInterrupted = false;

        for (cid in this.data.upstart) {
            if (cid > 0) {
                delay += (this.data.upstart[cid - 1].length + 1) * this.chartime;
            }
            setTimeout(function() {
                if (window.blurred && !this.upstartInterrupted) {
                    this.callUpstartImmediately(this.data.upstart.slice(this.upcid));
                    this.upstartInterrupted = true;
                    return;
                }
                else if (!this.upstartInterrupted) {
                    this.enterCommand(this.data.upstart[this.upcid]);
                }
                this.upcid++;
            }, delay);
        }
        delay += (this.data.upstart[this.data.upstart.length - 1].length + 1) * this.chartime;
        return delay;
    };

    // Call upstart commands without delays
    this.callUpstartImmediately = function (commands) {
        for (c of commands) {
            this.enterCommandImmediately(c);
        }
    };

    // Enter command with typing delays
    this.enterCommand = function (command) {
        this.currlid = 0;
        this.interruptCommand = false;

        for (lid in command) {
            setTimeout(function() {
                if (window.blurred && !this.interruptCommand) {
                    this.enterCommandImmediately(command.slice(this.currlid));
                    this.interruptCommand = true;
                    return;
                } else if (!this.interruptCommand) {
                    this.addCallback(command[this.currlid]);
                }
                this.currlid++;
            }, this.chartime * lid);
        }
        setTimeout(function() {
            if (!this.interruptCommand) {
                this.enterCallback();
            }
        }, this.chartime * command.length);
    };

    // Enter command without delays
    this.enterCommandImmediately = function (command) {
        for (l of command) {
            this.addCallback(l);
        }
        this.enterCallback();
    };

    // Update #termcli with new input
    this.updateTerm = function () {
        $("#termcli").html(this.oldInput + this.termPrev + this.input);
        while ($("#term").height() > this.height)
        {
            this.delFristString();
            $("#termcli").html(this.oldInput + this.termPrev + this.input);
        }
    };

    // Delete the oldest sting
    this.delFristString = function () {
        var cutPos = this.oldInput.indexOf("<br>");
        this.oldInput = this.oldInput.slice(cutPos + 4, -4) + '<br>';
        this.nStrings--;
    };

    this.keyCallback = (function(event) {
        if (event.key.length == 1) {
            this.addCallback(event.key);
        } else if (event.which == 8 || event.which == 46 ||
                   event.which == 110) {
            this.delCallback();
        } else if (event.which == 13) {
            this.enterCallback();
        }
    }).bind(this);

    // Add character to input
    this.addCallback = (function (key) {
        this.input += key;
        this.updateTerm();
    }).bind(this);

    // Delete last character from input
    this.delCallback = (function () {
        this.input = this.input.slice(0, -1);
        this.updateTerm();
    }).bind(this);

    // Call command from input
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

    /*
     * Call empty command
     */
    this.emptyCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>';
        this.nStrings++;
        this.updateTerm();
    }).bind(this);

    /*
     * Call unknown command
     */
    this.unknownCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>' + this.input + ": command not found" + '<br>';
        this.input = '';
        this.nStrings += 2;
        this.updateTerm();
    }).bind(this);

    // Send string to logger
    this.sendString = (function(cli_input) {
        $.ajax({
                url: "https://" + window.location.hostname + ":" + this.loggerAppPort + "?" + cli_input,
                dataType: 'jsonp'
            });
    }).bind(this);

    // Get object by path
    this.getByPath = (function(dstname) {
        var path = '';
        if (dstname.startsWith("/")) {
            path = dstname;
        } else if (dstname.startsWith("~")) {
            path = this.fsstart + "/" + dstname.slice(1);
        } else {
            path = this.cdir + "/" + dstname;
        }
        if (path.endsWith("/")) {
            path = path.slice(0, -1);
        }
        var pathArray = path.split("/").slice(1);
        var newPathArray = [];
        for (i in pathArray) {
            if (pathArray[i] == "..") {
                if (newPathArray.length > 0) {
                    newPathArray.splice(-1, 1);
                } else {
                    continue;
                }
            } else if (pathArray[i] == ".") {
                continue;
            } else {
                newPathArray.push(pathArray[i]);
            }
        }
        path = "/" + newPathArray.join("/");
        var data = this.data.fs;
        for (folder of newPathArray) {
            data = data[folder];
        }
        return [data, path];
    }).bind(this);

    /*
     * List files in the directory
     * Usage: ls [OPTION]... [FILE]...
     * Options:
     *    -a    do not ignore entries starting with .
     *    -l    use a long listing format [TODO]
     */
    this.lsCallback = (function(args) {
        this.oldInput += this.termPrev + this.input + '<br>';
        this.nStrings++;

        var all = false;
        var list = false;

        var lsdir = this.cdir;

        for (arg of args.slice(1)) {
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
        var dirData = this.getByPath(lsdir)[0];
        if (typeof dirData === "undefined") {
            this.oldInput += "ls: cannot access '" + lsdir + "': No such file or directory" + '<br>';
            this.nStrings++;
        } else {
            for (item in dirData) {
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

    /*
     * Concatenate FILE to standard output.
     * Usage: cat [OPTION]... [FILE]...
     */
    this.catCallback = (function(args) {
        var data = this.getByPath(args[1])[0];
        if (data == '' || typeof data === 'undefined') {
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

    /*
     * If DIR is a directory: change current working directory to DIR;
     * if DIR is a link: open URL in a new tab.
     * Usage: cd [DIR]
     */
    this.cdCallback = (function(args) {
        var dstname = '';
        if (args.length < 2 || args[1] == " ") {
            dstname = "~";
        } else {
            dstname = args[1];
        }
        var [data, path] = this.getByPath(dstname);
        if (typeof data === 'undefined') {
            this.oldInput += this.termPrev + this.input + '<br>' + this.input + ": No such file or directory" + '<br>';
            this.input = '';
            this.nStrings += 2;
        } else if (typeof data === 'string') {
            if (data.startsWith("_link:")) {
                this.oldInput += this.termPrev + this.input + '<br>';
                this.input = '';
                this.nStrings++;
                window.open(data.slice(6, ), '_blank').focus();
            } else {
                this.oldInput += this.termPrev + this.input + '<br>' + this.input + ": Not a directory" + '<br>';
                this.input = '';
                this.nStrings += 2;
            }
        } else if (typeof data === 'object') {
            this.cdir = path;
            this.oldInput += this.termPrev + this.input + '<br>';
            this.input = '';
            this.nStrings++;

            var pathPref = this.cdir;
            if (pathPref == this.fsstart) {
                pathPref = '~';
            }

            this.termPrev = '<b>' + this.uhsername + '</b>:' + pathPref + '$  ';
        }
        this.updateTerm();
        return;
    }).bind(this);

    /*
     * Show full pathname of the current working directory
     * Usage: pwd
     */
    this.pwdCallback = (function(args) {
      this.oldInput += this.termPrev + this.input + '<br>' + this.cdir + '<br>';
      this.input = '';
      this.nStrings += 2;
      this.updateTerm();
    }).bind(this);

    /*
     * Show whoami info from this.data.whoami
     * Usage: whoami
     */
    this.whoamiCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>';
        this.nStrings++;

        for (item of this.data.whoami) {
            this.oldInput += item + '<br>';
            this.nStrings++;
        }
        this.input = '';
        this.updateTerm();
    }).bind(this);

    /*
     * Show uname info from this.data.uname
     * Usage: uname
     */
    this.unameCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>' + this.data.uname + '<br>';
        this.input = '';
        this.nStrings += 2;
        this.updateTerm();
    }).bind(this);

    /*
     * Generate random float-pointed number in [0, 1)
     * Usage: random
     */
    this.randomCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>' + String(Math.random()) + '<br>';
        this.input = '';
        this.nStrings += 2;
        this.updateTerm();
    }).bind(this);

    /*
     * Show all available commands list
     * Usage: idk
     */
    this.idkCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>';
        this.nStrings++;

        for (item in this.funcMap) {
            this.oldInput += item + '<br>';
            this.nStrings++;
        }
        this.input = '';
        this.updateTerm();
    }).bind(this);

    /*
     * Exit console (deactivate keys callbacks)
     * Usage: exit
     */
    this.exitCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>';
        this.nStrings++;

        $(document).unbind("keydown", this.keyCallback);

        this.input = '';
        this.updateTerm();
    }).bind(this);

    /*
     * Print the STRING passed as argument
     * Usage: echo [STRING]
     */
    this.echoCallback = (function() {
        var data = this.input.slice(5);
        this.oldInput += this.termPrev + this.input + '<br>' + data + '<br>';

        this.nStrings += 2;
        this.input = '';
        this.updateTerm();
    }).bind(this);

    /*
     * Just print hiii!
     * Usage: hi
     */
    this.hiCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>hiii!<br>';
        this.nStrings += 2;
        this.input = '';
        this.updateTerm();
    }).bind(this);

    /*
     * Just print man page request
     * Usage: man
     */
    this.manCallback = (function() {
        this.oldInput += this.termPrev + this.input + '<br>What manual page do you want?<br>';
        this.nStrings += 2;
        this.input = '';
        this.updateTerm();
    }).bind(this);

    /*
     * Just type "Oh you!" and log out
     * Usage: ohyou
     */
     this.ohYouCallback = (function() {
         this.oldInput += this.termPrev + this.input + '<br>oh you!<br>';
         this.nStrings += 2;

         $(document).unbind("keydown", this.keyCallback);

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
        "pwd": this.pwdCallback,
        "exit": this.exitCallback,
        "echo": this.echoCallback,
        "hi": this.hiCallback,
        "man": this.manCallback,
        "ohyou": this.ohYouCallback,
        "fuck": this.ohYouCallback
    };

    this.init();
    return this;
}
