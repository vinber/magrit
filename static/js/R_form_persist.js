$(document).ready(function() {
    $('button').submit(function(e) {
        e.preventDefault();
		$.post('', $('textarea').val().serialize() , function(res) {document.getElementById("content").innerHTML = response});
});});
/*
        var user = $('#txtRcommande').val();
		var content = $('#content');
        $.ajax({
            url: '/RrCommande2',
            data: $('textarea').val().serialize(),
            type: 'POST',
            success: function(response) {
        document.getElementById("content").innerHTML = response;
            },
            error: function(error) {
				console.log(error);
            }
        });
	return false;
    });
});
*/