var searchResults = [];

var resultsParent;
var queueParent;

var audio = null;
var source = null;

var volumeTimer = null;
var volumeFadeDelay = 2250;
var volumeFadeTime = 125;

var queue = [];
var playing = false;

var serverCookie = "gotube_ip";
var portCookie = "gotube_port";
var volumeCookie = "gotube_volume";
var playerCookie = "gotube_player";

var version;

var modalFadeTime = 175;

/* === prototypes & extention methods === */
Date.time = function() {
    return + new Date();
}

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

/* === playback methods === */
function playUrl(url) {
    audio.trigger('pause');
    source.attr("src", url);
    audio.trigger('load');
    audio.prop('currentTime', 0);
    audio.trigger('play');
}

function restart() {
    audio.trigger('pause');
    audio.prop('currentTime', 0);
    audio.trigger('play');
}

function loadVolume() {
    var level = Cookies.get(volumeCookie);
    if (level !== undefined) {
        setVolume(level);
        var range = Math.round((1 - level) * 100);
        $(".slider-holder input").prop("value", range);
    }
}

function setVolume(level) {
    resetVolumeTimer();

    level = Number(level).clamp(0, 1);
    audio.prop('volume', level);
    Cookies.set(volumeCookie, level);
    
    // fix bugs related to anti-autoplay features 
    if (playing) {
        audio.trigger('play');
    }

    var volumeIcon = $("#volumeLevel");
    if (level == 0) {
        volumeIcon.text("volume_off");
    }
    else if (level < 0.2) {
        volumeIcon.text("volume_mute");
    }
    else if (level < 0.6) {
        volumeIcon.text("volume_down");
    }
    else {
        volumeIcon.text("volume_up");
    }
}

function resetVolumeTimer() {
    if (volumeTimer != null) {
        clearTimeout(volumeTimer);
    }
    volumeTimer = setTimeout(hideVolumeSlider, volumeFadeDelay);
}

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
        playUrl(apiAddr + "/stream/" + data);

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

function loadServerDetails() {
    var address = Cookies.get(serverCookie);
    var port = Cookies.get(portCookie);
    if ( address != undefined && port != undefined ) {
        $("#serverAddress").val(address);
        $("#serverPort").val(port);
    }

    return `http://${address}:${port}`;
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
    $('.modal-hider').fadeIn(modalFadeTime);
    $('.config').fadeIn(modalFadeTime);
}

function hideConnectionSettings() {
    $('.modal-hider').fadeOut(modalFadeTime, loadServerDetails);
    $('.config').fadeOut(modalFadeTime);
}

function showVolumeSlider() {
    resetVolumeTimer();
    $('#volumeLevel').fadeTo(volumeFadeTime, 0);
    $('.slider-holder').fadeIn();
}

function hideVolumeSlider() {
    $('#volumeLevel').fadeTo(volumeFadeTime, 1);
    $('.slider-holder').fadeOut();
}

function updateVersion() {
    var subheader = $("header h2");
    var header = $("header");

    if (version == null) {
        subheader.text("[disconnected]");
        header.removeClass("connected");
    }
    else {
        subheader.text("v" + version);
        header.addClass("connected");
    }
}

function init() {
    $.ajax({
        url:getApiAddress() + "/version"
    })
    .done(function(data){
        var re = /^(?:gotube\/)((?:[0-9]+\.){2}[0-9]+)\s*$/;

        // check the server is a gotube server.
        if (!re.test(data)){
            showConnectionSettings();
            return;
        }

        version = data.match(re)[1];

        console.log(`connected to gotube v${version} on ${getApiAddress()}.`);
        updateVersion();

        saveServerDetails();
        updateQueue();
    })
    .fail(function(){
        console.log("no connection D:");
        showConnectionSettings();
    });
}

function getApiAddress() {
    var address = Cookies.get(serverCookie);
    var port = Cookies.get(portCookie);

    return `http://${address}:${port}`;
}

function loadNext() {
    var url = getApiAddress() + "/queue/next";
    audio.trigger('pause');

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
                .append($("<li></li>")
                .append($("<a/>",
                {
                    text: queue[i].title
                })));
        }

        console.log("queue loaded of length: " + queue.length);

        playTop();
    })
    .fail(function () {
        alert("error: unable to get queue");
    });
}

function doSearch() {
    var query = $("#searchQuery").val();

    console.log("search: " + query); 

    var url = getApiAddress() + "/search";
    var postData = JSON.stringify({
        query: query,
        maxResults: 10
    });

    $.post({
        url: url,
        data: postData
    })
    .done(function (data) {
        // clear previous results
        resultsParent.html("");

        // show the search term
        $(".search").removeClass("empty");
        $(".search h3").text(query);

        searchResults = JSON.parse(data);
        console.log(data);

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
}

function addToQueue(id) {
    var url = getApiAddress() + "/queue/add";

    queueParent
        .append($("<li></li>")
            .append($("<a/>", 
                {
                    text: searchResults[id]['title']
                })));

    $.post({
        url: url,
        data: JSON.stringify(searchResults[id]) 
    })
    .done(function () {
        updateQueue(); 
    })
    .fail(function (xhr) {
        alert(xhr.statusText);
    });
}

$(function() {
    // >>- global accessors -<< //
    audio = $("audio");
    source = $("audio source");

    resultsParent = $("#searchResults");
    queueParent = $("#queueParent");

    // >>- button click binds -<< //
    // search box
    $("#searchButton").click(doSearch);

    $("#searchQuery").on('keyup', function (e) {
        if (e.keyCode == 13) {
            doSearch();
        }
    });

    // search results
    resultsParent.on("click", "li a", function () {
        var id = parseInt($(this).attr("id"));
        addToQueue(id);
    });

    // server config modal
    $("#configClose").click(hideConnectionSettings);

    $("#configSettings").click(showConnectionSettings);

    $("#configButton").click(function() {
        saveServerDetails();
        location.reload();
    });

    // volume slider
    $("#volumeLevel").click(showVolumeSlider);

    // queue
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

    // bottom bar buttons
    $(".play-pause").click(function() {
        if (playing) {
            audio.trigger('pause');
        } else {
            audio.trigger('play');
        }
    });

    $(".restart").click(restart);

    $(".skip").click(loadNext);

    // >>- audio event binds -<< //
    audio.bind("pause", function() {
        playing = false;
        $(".play-pause").text("play_circle_filled");
    });
    
    audio.bind("play", function() {
        playing = true;
        $(".play-pause").text("pause_circle_filled");
    });

    audio.bind("ended", loadNext);

    // volume slider bind
    $('.slider-holder input').bind("input", function() {
        setVolume(1 - (this.value / 100));
    });

    // >>- initialization -<< //
    loadServerDetails();
    loadVolume();
    init();
});
