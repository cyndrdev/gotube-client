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

    // search result button handler 
    resultsParent.on("click", "li button", function () {
        var i = parseInt($(this).attr("id"));
        var url = getApiAddress() + "/queue/add";

        $.post({
            url: url,
            data: JSON.stringify(searchResults[i]) 
        })
        .done(function () {
            console.log("server downloaded: " + searchResults[i].title);
        })
        .fail(function () {
            alert("error");
        });
    });

    function getApiAddress() {
        var address = $("#serverAddress").val();
        var port = $("#serverPort").val();

        return `http://${address}:${port}`;
    }
});
