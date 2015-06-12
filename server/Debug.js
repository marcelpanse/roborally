//This startup is used to add all the existing boards to the Boards collection
Meteor.startup(function()
{
    for(var i in BoardBox.CATALOG)
    {
        var board_name = BoardBox.CATALOG[i];
        var board_id = BoardBox.getBoardId(board_name);
        var board = BoardBox.getBoard(board_id);
        
        if(board != undefined && board != null)
        {
            if(Boards.findOne({board_id: board_id}) == null)
            {
                console.log("Adding " + board_name + " to Boards collection");
                board.board_id = board_id;
                board.owner = "System";
                Boards.insert(board);
            }
        }
    }
});