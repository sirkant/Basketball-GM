//
//  TheAssociation.swift
//  Basketball GM
//
//  Created by Luis Caceres on 2020-05-17.
//  Copyright © 2020 Luis Caceres. All rights reserved.
//

import Foundation

class Association {
    var leagueGames: [Game]
    var leagueYear: Int
    var leagueTeams: [Team]
    var currentDay: Int
    var gameSchedule: [Int : [Game]]
    
    init(){
        leagueGames = []
        leagueYear = 0
        leagueTeams = []
        currentDay = 0
        gameSchedule = [0:[]]
    }
    
    struct LeagueConstants {
        static let daysInSeason = 200
        static let totalTeams = 30
    }
    
    
    func setUpSeason() {
        for (i, team1) in leagueTeams.enumerated() {
            for team2 in leagueTeams[i+1 ..< leagueTeams.count] {
                leagueGames.append(Game(team1: team1, team2: team2))
            }
        }
    }
}



