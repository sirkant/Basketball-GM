//
//  TheAssociation.swift
//  Basketball GM
//
//  Created by Luis Caceres on 2020-05-17.
//  Copyright © 2020 Luis Caceres. All rights reserved.
//

import Foundation

//class Association {
//    static let sharedInstance = Association()
//    var leagueGames: [Game]
//    var leagueYear: Int
//    var leagueStats: LeagueStats
//    var leagueTeams: [Team]
//    var currentDay: Int
//    var gameSchedule: [Int : [Game]]
//
//    init(){
//        leagueGames = []
//        leagueYear = 0
//        leagueStats =
//        leagueTeams = []
//    }
//
//struct LeagueStats {
//    var playerPoints = [String: Int]()
//    var teamWins = [String : Int]()
//    var teamLosses = [String : Int]()
//}
//    
//struct LeagueConstants {
//    static let daysInSeason = 200
//    static let totalTeams = 30
//}
//    
//    func setUpLeagueTeams() {
//        for team in K.teamNames {
//            leagueTeams.append(team)
//    }
//    
//    
//    func setUpSeason() {
//        for (i, team1) in leagueTeams.enumerated() {
//            for team2 in leagueTeams[i+1 ..< leagueTeams.count] {
//                leagueGames.append(Game(team1: team1, team2: team2))
//        }
//        }
//        
//        for game in leagueGames {
//            addGameToDay(game: game)
//        }
//    }
//
//    func addGameToDay(game : Game) {
//        var day = 0
//        repeat {
//            if gameSchedule[day] == nil {
//                gameSchedule[day] = [game]
//                break
//            } else if game.canScheduleGame(scheduledGames: gameSchedule[day]!) {
//                gameSchedule[day]!.append(game)
//                break
//            }
//            day = Int.random(in: 1 ... LeagueConstants.daysInSeason)
//        } while (day >= 0)
//}
//
//    func canScheduleGame(scheduledGames: [Game]) -> Bool {
//        if scheduledGames.count >= 5 { return false }
//        
//        for game in scheduledGames {
//            if game.teamOne.teamName == teamOne.teamName || game.teamOne.teamName == teamTwo.teamName || game.teamTwo.teamName == teamOne.teamName || game.teamTwo.teamName == teamTwo.teamName {
//                return false
//            }
//        }
//        return true
//    }
//}


