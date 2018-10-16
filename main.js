$(function() {
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
