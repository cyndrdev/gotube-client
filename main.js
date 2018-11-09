var searchResults = [];
var resultsParent;
var queueParent;

var player = null;
var queue = [];
var playing = false;

var serverCookie = "gotube_ip";
var portCookie = "gotube_port";

/* ==== time prototypes ==== */
Date.time = function() {
    return + new Date();
}

/* ==== playback methods ==== */
function playTop() {
    if (!queue || !queue.length)
        return;

    if (playing)
        return;

    var apiAddr = getApiAddress();
    var idUrl = apiAddr + "/queue/top";
    
    // first get the id of the song at the top of the queue
    $.ajax({url:idUrl})
    .done(function (data) {
        console.log(data);

        // then play the song with that id
        player.setSrc(apiAddr + "/stream/" + data);
        player.load();
        player.play();

        updateArtwork(data);

        playing = true;
    })
    .fail(function () {
        alert("unable to get queue top");
    });
}

function updateArtwork(data) {
    var arturl = "https://img.youtube.com/vi/" + data + "/maxresdefault.jpg";

    var artwork = $("img.artwork");

    artwork.attr("src", arturl);
}

function initPlayer() {
    var playerParent = $("#playerParent");

    // destroy any existing player
    if (player) {
        player.pause();
        player.remove();
    }
    playerParent.html("");

    playerParent
        .append($("<audio></audio>",
            {
                preload: "none",
                type: "audio/webm",
                controls: true,
                id: "player"
            }));

    var pElement = $("#player");

    pElement.mediaelementplayer({
        success: function (media, node, instance) {
            console.log("player loaded");
        }
    });

    pElement.on("ended", function() {
        playing = false;
        loadNext();
    });

    player = mejs.players["mep_0"];
}

function loadServerDetails() {
    var address = Cookies.get(serverCookie);
    var port = Cookies.get(portCookie);
    if ( address != undefined && port != undefined ) {
        $("#serverAddress").val(address);
        $("#serverPort").val(port);
    }
    return address + ":" + port;
}

function saveServerDetails() {
    var address = $("#serverAddress").val();
    var port = $("#serverPort").val();
    Cookies.set(serverCookie, address)
    Cookies.set(portCookie, port);
    return address + ":" + port;
}

function clearServerDetails() {
    Cookies.remove(serverCookie);
    Cookies.remove(portCookie);
}

function showConnectionSettings() {
    $('.modal-hider').fadeIn();
    $('.config').fadeIn();
}

function hideConnectionSettings() {
    $('.modal-hider').fadeOut();
    $('.config').fadeOut();
}

function init() {
    $.ajax({
        url:getApiAddress() + "/ping"
    })
    .done(function(data){
        saveServerDetails();

        var serverTime = data / 1000000;
        var currentTime = Date.time();
        console.log("connection established (" + Math.round(currentTime - serverTime) + "ms)");

        updateQueue();
        initPlayer();
    })
    .fail(function(){
        console.log("no connection D:");
        showConnectionSettings();
    });
}

function getApiAddress() {
    var address = $("#serverAddress").val();
    var port = $("#serverPort").val();

    return `http://${address}:${port}`;
}

function loadNext() {
    var url = getApiAddress() + "/queue/next";

    $.post({url:url})
    .done(function() { 
        updateQueue();
    })
    .fail(function() {
        alert("unable to load next");
    });
}

function updateQueue() {
    var url = getApiAddress() + "/queue";

    $.ajax({url: url})
    .done(function (data) {
        queue = JSON.parse(data);
        
        if (!queue || !queue.length) // queue is empty i guess 
            return;

        // clear whatever was already there
        queueParent.html("");

        for (var i = 0; i < queue.length; i++) {
            console.log(queue[i].title);

            queueParent
                .append($("<li></li>",
                {
                    text: queue[i].title
                }));
        }

        console.log("queue loaded of length: " + queue.length);
        console.log(player);

        playTop();
    })
    .fail(function () {
        alert("error: unable to get queue");
    });
}

$(function() {
    resultsParent = $("#searchResults");
    queueParent = $("#queueParent");

    $("#searchButton").click(function() {
        var query = $("#searchQuery").val();

        console.log("search: " + query); 

        var url = getApiAddress() + "/search";
        var postData = JSON.stringify({
            query: query
        });

        $.post({
            url: url,
            data: postData
        })
        .done(function (data) {
            // clear previous results
            resultsParent.html("");

            searchResults = JSON.parse(data);

            // create a list element with a button for each result
            for (var i = 0; i < searchResults.length; i++) {
                resultsParent
                    .append($("<li></li>")
                    .append($("<a/>", 
                    {
                        text: searchResults[i].title,
                        id: i,
                        href: "#"
                    })));
            }
        })
        .fail(function () {
            alert("search failed");
        })
        .always(function () {
            console.log("search complete");
        });
    });

    // search result button handler 
    resultsParent.on("click", "li a", function () {
        var i = parseInt($(this).attr("id"));
        var url = getApiAddress() + "/queue/add";

        $.post({
            url: url,
            data: JSON.stringify(searchResults[i]) 
        })
        .done(function () {
            updateQueue(); 
        })
        .fail(function (xhr) {
            alert(xhr.statusText);
        });
    });

    $("#configButton").click(function() {
        saveServerDetails();
        location.reload();
    });

    $("#clearQueue").click(function () {
        var url = getApiAddress() + "/queue/clear";
        var postData = { index: -1 };

        console.log(JSON.stringify(postData)); 

        // clear queue display
        queueParent.html("");

        $.post({ 
            url: url,
            data: JSON.stringify(postData)
        })
        .done(function () {
            console.log("server queue cleared"); 
        })
        .fail(function (xhr) {
            alert(xhr.statusText);
        });
    });
    
    autoplayNext = true;
    loadServerDetails();
    init();
});
