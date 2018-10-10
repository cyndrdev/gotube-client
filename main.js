$(function() {
    $("#queueAdd").click(function() {
        console.log("clicked boi");

        var url = "http://localhost:8080/queue/add";
        var postData = JSON.stringify({
            url: "https://www.youtube.com/watch?v=mg2cMqW_hOY"
        });

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
});
