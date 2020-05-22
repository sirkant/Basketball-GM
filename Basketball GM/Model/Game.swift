//
//  Game.swift
//  Basketball GM
//
//  Created by Luis Caceres on 2020-05-11.
//  Copyright © 2020 Luis Caceres. All rights reserved.
//

import Foundation

class Game {
    var teamOne : Team
    var teamTwo : Team
    var teamOneBoxScore : [String : [String : Int]]
    var teamTwoBoxScore : [String : [String : Int]]
    var teamScoreOne : Int
    var teamScoreTwo : Int
    var gameLog : [String]
    var team1Roster : [String]
    var team2Roster: [String]
    
    init(team1: Team, team2: Team) {
        teamOne = team1
        teamTwo = team2
        teamScoreOne = 0
        teamScoreTwo = 0
        teamOneBoxScore = [String : [String : Int]]()
        teamTwoBoxScore = [String : [String : Int]]()
        gameLog = []
        team1Roster = []
        team2Roster = []
    }
    
    
    func playPossession(attackingTeam : Team, defendingTeam : Team, boxScore: Int, passBonus: Int) -> (String, Int) {
        let playerOne = attackingTeam.roster.randomElement()!
        let playerTwo = defendingTeam.roster.randomElement()!
        
        
        var playResult : String = ""
        
        var score = 0
        
        //returns ("move", "move rating"), after calculating player tendencies
        let playerOneOffense = playerOne.getOffenseMoveAndRating()
        let playerOneMove = playerOneOffense.0
        let playerOneRating = playerOneOffense.1 + passBonus
        
        let playerTwoDefense = playerTwo.getDefensiveMoveAndRating(offensiveMove: playerOneMove)
        let playerTwoMove = playerTwoDefense.0
        let playerTwoRating = playerTwoDefense.1
        
        
        if playerOneRating > playerTwoRating {
            if playerOneMove == K.shootInside {
                score = 2
                playResult = "\(playerOne.name) (\(attackingTeam.abbreviation)) gets the ball and scores inside!"
                teamOneBoxScore[playerOne.name]?["points"]? += score
                gameLog.append(playResult)
            } else if playerOneMove == K.shoot3pt {
                score = 3
                playResult = "\(playerOne.name) (\(attackingTeam.abbreviation)) scores a three pointer!"
                teamOneBoxScore[playerOne.name]?["points"]? += score
                gameLog.append(playResult)
            } else if playerOneMove == K.pass {
                let passResult = playPossession(attackingTeam: attackingTeam, defendingTeam: defendingTeam, boxScore: 1, passBonus: playerOneRating)
                playResult = "\(playerOne.name) (\(attackingTeam.abbreviation)) decided to move the ball around in that last play with the results we saw."
                gameLog.append(playResult)
                
                if passResult.1 > 0 {
                    let anotherPlayer = attackingTeam.roster.randomElement()!
                    if anotherPlayer.name != playerOne.name {
                        playResult = "\(anotherPlayer.name) \(attackingTeam.abbreviation) keeps the ball moving."
                        gameLog.append(playResult)
                    } else {
                        playResult = "\(playerOne.name) \(attackingTeam.abbreviation) dribbled with the ball, only to kick it out to a teammate"
                        gameLog.append(playResult)
                    }
                    if boxScore == 1 {
                        teamOneBoxScore[playerOne.name]?[K.assists]? += 1
                    } else {
                        teamTwoBoxScore[playerOne.name]?[K.assists]? += 1
                    }
                    score = passResult.1
                    playResult = "\(attackingTeam.abbreviation) managed to find the open man in that attack after the ball movement."
                    gameLog.append(playResult)
                    
                
                } else {
                    attackFailsCommentary(team1: attackingTeam, team2: defendingTeam)
                }
            }
            
        } else {
            if playerTwoMove == K.insideDef {
                playResult = "Good defence by \(playerTwo.name) (\(defendingTeam.abbreviation)) on the inside shot"
                gameLog.append(playResult)
            } else if playerTwoMove == K.perimeterDef {
                playResult = "\(playerTwo.name) (\(defendingTeam.abbreviation)) has defended well the three there"
                gameLog.append(playResult)
            } else if playerTwoMove == K.steal {
                if boxScore == 1 {
                    teamTwoBoxScore[playerTwo.name]?[K.steal]? += 1
                } else {
                    teamTwoBoxScore[playerTwo.name]?[K.steal]? += 1
                }
                print("\(playerTwo.name) (\(defendingTeam.abbreviation)) steals the ball!")
                //boxScoreStat = "steals"
            } else {
                playResult = "Good team defense, that leads to a shot missed by \(playerOne.name) (\(attackingTeam.abbreviation)). Team rebound by \(defendingTeam.abbreviation)"
                gameLog.append(playResult)
            }
        }
        
        if boxScore == 1 {
            teamOneBoxScore[playerOne.name]?[K.points]? += score
        }  else {
            teamTwoBoxScore[playerOne.name]?[K.points]? += score
        }
        
        print(playResult)
        return (playResult, score)
    }
    
    
    func runGame() {
        
        print("\nRoster for \(teamOne.full_name):\n============\n")
        for player in teamOne.roster{
            let playerIntro = ("\(player.name)")
            team1Roster.append(playerIntro)
            print(playerIntro)
            
        }
        
        print("\nRoster for \(teamTwo.full_name):\n============\n")
        for player in teamTwo.roster{
            let playerIntro = ("\(player.name)")
            team2Roster.append(playerIntro)
            print(playerIntro)
        }
        
        
        let gameIntro = "The game is about to start... and here comes the jump ball!"
        gameLog.append(gameIntro)
        
        //1st Quarter
        for _ in 1...30 {
            let possession = playPossession(attackingTeam: teamOne, defendingTeam: teamTwo, boxScore: 1, passBonus: 0)
                teamScoreOne += possession.1
                gameLog.append(possession.0)
        
            print("\(teamOne.abbreviation): \(teamScoreOne) - \(teamTwo.abbreviation): \(teamScoreTwo)")
            
            let possession2 = playPossession(attackingTeam: teamTwo, defendingTeam: teamOne, boxScore: 2, passBonus: 0)
                teamScoreTwo += possession2.1
                gameLog.append(possession.0)
            
            print("\(teamOne.abbreviation): \(teamScoreOne) - \(teamTwo.abbreviation): \(teamScoreTwo)")
        }
        let firstQuarterText = "At the end of the first quarter, the score is: \(teamOne.full_name): \(teamScoreOne) - \(teamTwo.full_name): \(teamScoreTwo)\n"
        gameLog.append(firstQuarterText)
        
        //2nd Quarter
        for _ in 1...30 {
            teamScoreOne += playPossession(attackingTeam: teamOne, defendingTeam: teamTwo, boxScore: 1, passBonus: 0).1
            teamScoreTwo += playPossession(attackingTeam: teamTwo, defendingTeam: teamOne, boxScore: 2, passBonus: 0).1
        }
        let halfTimeText = "At half time, the score is: \(teamOne.full_name): \(teamScoreOne) - \(teamTwo.full_name): \(teamScoreTwo)\n"
        gameLog.append(halfTimeText)
        
        //3rd Quarter
        for _ in 1...30 {
            teamScoreOne += playPossession(attackingTeam: teamOne, defendingTeam: teamTwo, boxScore: 1, passBonus: 0).1
            teamScoreTwo += playPossession(attackingTeam: teamTwo, defendingTeam: teamOne, boxScore: 2, passBonus: 0).1
        }
        let thirdQuarterText = "At the end of the third quarter, the score is: \(teamOne.full_name): \(teamScoreOne) - \(teamTwo.full_name): \(teamScoreTwo)\n"
        gameLog.append(thirdQuarterText)
    
        //4th quarter
        for _ in 1...30 {
            teamScoreOne += playPossession(attackingTeam: teamOne, defendingTeam: teamTwo, boxScore: 1, passBonus: 0).1
            teamScoreTwo += playPossession(attackingTeam: teamTwo, defendingTeam: teamOne, boxScore: 2, passBonus: 0).1
        }
        let endGameText = "At the end of the game, the final score is: \(teamOne.full_name): \(teamScoreOne) - \(teamTwo.full_name): \(teamScoreTwo)"
        gameLog.append(endGameText)
        
        
        
        
        let resultText = "Final score: \n\(teamOne.full_name): \(teamScoreOne) \n\(teamTwo.full_name): \(teamScoreTwo)"
        gameLog.append(resultText)
        
        print("\n\(teamOne.full_name) BOX SCORE:\n===============\n")
        for player in teamOne.roster {
            print("\(player.name): \(teamOneBoxScore[player.name]?["points"] ?? 0) points \n\(teamOneBoxScore[player.name]?["assists"] ?? 0) assists \n\(teamOneBoxScore[player.name]?["steals"] ?? 0) steals\n")
        }
        
        print("\n\(teamTwo.full_name) BOX SCORE:\n===============\n")
        for player in teamTwo.roster {
            print("\(player.name): \(teamTwoBoxScore[player.name]?["points"] ?? 0) points \n\(teamTwoBoxScore[player.name]?["assists"] ?? 0) assists \n\(teamTwoBoxScore[player.name]?["steals"] ?? 0) steals\n")
        }
        
        
    }
    
    func attackFailsCommentary(team1: Team, team2: Team) {
        let commentary = [
            "\(team1.abbreviation) - Shot missed. Rebound for \(team2.abbreviation)",
            "\(team1.abbreviation) Misplaced pass. Turnover.",
            "Shot clock violation by \(team1.abbreviation)",
            "The player complains but the referee calls no foul, ball out of bounds for \(team2.abbreviation)",
            "Too long of a pass by \(team1.abbreviation), the ball ended up on the third row of the stands! Ball for \(team2.abbreviation)"
        ]
        let attackBreaks = commentary.randomElement()!
        print(attackBreaks)
    }
}
