$(function() {
    var searchResults = [];
    var resultsParent = $("#searchResults");

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
    // handler for search result buttons
    resultsParent.on("click", "li button", function () {
        var i = parseInt($(this).attr("id"));

        // var url = `https://youtube.com/watch?v=${id}`;
        console.log(searchResults[i].id); 
    });

    $("#queueAdd").click(function() {
        console.log("clicked boi");

        var url = getApiAddress() + "/queue/add";
        var postData = JSON.stringify({
            url: "https://www.youtube.com/watch?v=mg2cMqW_hOY"
        });

        console.log("posting to:\t" + url);

        $.post({
            url: url, 
            data: postData
        })
        .done(function () {
            alert("success");
        })
        .fail(function (xhr) {
            alert(xhr.statusText);
        });
    });

    function getApiAddress() {
        var address = $("#serverAddress").val();
        var port = $("#serverPort").val();

        return `http://${address}:${port}`;
    }
});
