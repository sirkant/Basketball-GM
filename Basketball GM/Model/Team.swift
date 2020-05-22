//
//  Team.swift
//  Basketball GM
//
//  Created by Luis Caceres on 2020-05-11.
//  Copyright © 2020 Luis Caceres. All rights reserved.
//

import Foundation

class Team {
    var roster : [Player]
    var full_name : String
    var abbreviation : String
    var id : Int
    var city : String
    var conference : String
    var division : String
    var name : String
    
    init(players: [Player]) {
        roster = players
        //This stays until 1) I can retrieve and save all info and 2) I can fetch at the beginning of the game all of it.
        full_name = nameGenerator.pickRandomTeamName()
        abbreviation = nameGenerator.getShortName(teamName: full_name)
        id = 0
        city = "city"
        conference = "conference"
        division = "division"
        name = "name"
    }

}

func makeRandomTeam() -> Team {
    var roster = [Player]()
    for _ in 1...5 {
        let player = makeRandomPlayer()
        roster.append(player)
    }
    
    return Team(players: roster)
}
