$(function() {
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
            // alert(data);

            var results = JSON.parse(data);

            var html = "<ul>";
            for (var i = 0; i < results.length; i++) {
                var title = results[i].title;
                var id = results[i].id;

                html += `
                    <li>
                        <a href="https://youtube.com/watch?v=${id}">${title}</a>
                    </li>`;
            }
            html += "</ul>";
            
            $("#searchResults").html(html);
        })
        .fail(function () {
            alert("search failed");
        })
        .always(function () {
            console.log("search complete");
        });
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
