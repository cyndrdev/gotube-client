$(function() {
    var searchResults = [];
    var resultsParent = $("#searchResults");
    var queueParent = $("#queueParent");
    var player;

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
                    .append($("<button/>", 
                    {
                        text: searchResults[i].title,
                        id: i
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
    resultsParent.on("click", "li button", function () {
        var i = parseInt($(this).attr("id"));
        var url = getApiAddress() + "/queue/add";

        $.post({
            url: url,
            data: JSON.stringify(searchResults[i]) 
        })
        .done(function () {
            updateQueueDisplay(); 
        })
        .fail(function (xhr) {
            alert(xhr.statusText);
        });
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
    
    function updateQueueDisplay() {
        var url = getApiAddress() + "/queue";

        $.ajax({url: url})
        .done(function (data) {
            var queue = JSON.parse(data);
            
            if (!queue) // queue is empty i guess 
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

            console.log(queue.length);
            if (queue.length != 0) {
                player.load();
                player.play();
            }
        })
        .fail(function () {
            alert("error: unable to get queue");
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
            updateQueueDisplay();
    
            player.pause();
            player.remove();

            initPlayer();

            player.load();
            player.play();
        })
        .fail(function() {
            alert("unable to load next");
        });
    }

    function initPlayer() {
        var pElement = $("#player");

        pElement.mediaelementplayer({
            success: function (media, node, instance) {
                console.log(media);
                console.log(node);
                console.log(instance);
            }
        });
        pElement.on("ended", function() {
            loadNext();
        });

        player = mejs.players["mep_0"];
    }

    // get the queue from the server as soon as the page loads
    initPlayer();
    updateQueueDisplay();
});
