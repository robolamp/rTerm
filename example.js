$(document).ready(function (){
    initTerm();
});

function initTerm() {
    this.term = rTerm({
        height: 400,
        username: "robolamp",
        hostname: "host",
        file: "example.json"
    });
};
