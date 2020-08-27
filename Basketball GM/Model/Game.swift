//
//  Game.swift
//  Basketball GM
//
//  Created by Luis Caceres on 2020-05-11.
//  Copyright © 2020 Luis Caceres. All rights reserved.
//

import Foundation

class Game {
    
    //MARK: - Properties
    var teamOne : Team
    var teamTwo : Team
    var teamOneBoxScore : [String : Int]
    var teamTwoBoxScore : [String : Int]
    var teamScoreOne : Int
    var teamScoreTwo : Int
    var gameLog : [String]
    var team1Roster : [String]
    var team2Roster: [String]
    var firstQuarterScore : [String : Int]
    var htScore : [String : Int]
    var thirdQuarterScore : [String : Int]
    
    init(team1: Team, team2: Team) {
        teamOne = team1
        teamTwo = team2
        teamScoreOne = 0
        teamScoreTwo = 0
        teamOneBoxScore = [String : Int]()
        teamTwoBoxScore = [String : Int]()
        gameLog = []
        team1Roster = []
        team2Roster = []
        firstQuarterScore = [:]
        htScore = [:]
        thirdQuarterScore = [:]
    }
 
    //MARK: - Posession logic
    func playposession(attackingTeam : Team, defendingTeam : Team, boxScore: Int, passBonus: Int) -> (String, Int, String) {
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
                
            } else if playerOneMove == K.shoot3pt {
                score = 3
                playResult = "\(playerOne.name) (\(attackingTeam.abbreviation)) scores a three pointer!"
                
            } else if playerOneMove == K.pass {
                let passResult = playposession(attackingTeam: attackingTeam, defendingTeam: defendingTeam, boxScore: 1, passBonus: playerOneRating)
                playResult = "\(playerOne.name) (\(attackingTeam.abbreviation)) went for the long passing play."
                
                if passResult.1 > 0 {
                    let anotherPlayer = attackingTeam.roster.randomElement()!
                    if anotherPlayer.name != playerOne.name {
                        playResult = "\(anotherPlayer.name) \(attackingTeam.abbreviation) keeps the ball moving."
                        
                    } else {
                        playResult = "\(playerOne.name) \(attackingTeam.abbreviation) dribbled with the ball, only to kick it out to a teammate"
                        
                    }
                
                    score = passResult.1
                    playResult = "\(attackingTeam.abbreviation) managed to find the open man in that attack after the ball movement."
                    
                
                } else {
                    attackFailsCommentary(team1: attackingTeam, team2: defendingTeam)
                }
            }
            
        } else {
            if playerTwoMove == K.insideDef {
                playResult = "Good defence by \(playerTwo.name) (\(defendingTeam.abbreviation)) on the inside shot"
            } else if playerTwoMove == K.perimeterDef {
                playResult = "\(playerTwo.name) (\(defendingTeam.abbreviation)) has defended well the three there"
            } else if playerTwoMove == K.steal {
                playResult = "\(playerTwo.name) (\(defendingTeam.abbreviation)) steals the ball!"
            } else {
                playResult = "Good team defense, that leads to a shot missed by \(playerOne.name) (\(attackingTeam.abbreviation)). Team rebound by \(defendingTeam.abbreviation)"
            }
        }
        return (playResult, score, playerOne.name)
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
    
    //MARK: - Game sequence
    func setUpBoxScore(team1: Team, team2: Team) -> BoxScore {
        var currentGameBoxScore = BoxScore()
        for member in team1.roster {
            currentGameBoxScore.player[team1.abbreviation] = member.name
        }
        for member in team2.roster{
            currentGameBoxScore.player[team2.abbreviation] = member.name
        }
        return currentGameBoxScore
    }
    
    
    func runIntro() {
        print("\nRoster for \(teamOne.full_name):\n============\n")
        
        for player in teamOne.roster{
            let playerIntro = ("\(player.name)")
            //team1Roster.append(playerIntro)
            teamOneBoxScore[playerIntro] = 0
            print("\(playerIntro), he is a \(player.threePointShot)% shooter from 3")
        }
        
        print("\nRoster for \(teamTwo.full_name):\n============\n")
        
        for player in teamTwo.roster{
            let playerIntro = ("\(player.name)")
            team2Roster.append(playerIntro)
            teamTwoBoxScore[playerIntro] = 0
            print("\(playerIntro), he is a \(player.threePointShot)% shooter from 3")
        }
        
        let gameIntro = "\n The game is about to start between the \(teamOne.name) and the \(teamTwo.name) ... and here comes the jump ball!"
        print(gameIntro)
        gameLog.append(gameIntro)
        
    }
    
    func runQuarter() {
        for play in 1...30 {
            let posession = playposession(attackingTeam: teamOne, defendingTeam: teamTwo, boxScore: 1, passBonus: 0)
            teamScoreOne += posession.1
            teamOneBoxScore[posession.2]! += posession.1
            gameLog.append(posession.0)
            print(posession.0)
            if posession.1 > 0 {
                print("\(posession.2) \(teamOne.abbreviation) - \(String(describing: teamOneBoxScore[posession.2]!)) points")
            }
            print("\(teamOne.abbreviation): \(teamScoreOne) - \(teamTwo.abbreviation): \(teamScoreTwo)")
            
            let posession2 = playposession(attackingTeam: teamTwo, defendingTeam: teamOne, boxScore: 2, passBonus: 0)
            teamScoreTwo += posession2.1
            teamTwoBoxScore[posession2.2]! += posession2.1
            gameLog.append(posession2.0)
            
            print(posession2.0)
            print("\(teamOne.abbreviation): \(teamScoreOne) - \(teamTwo.abbreviation): \(teamScoreTwo)")
        }
    }
    
    func finishGameCommentary() {
        let resultText =
        "Final score: \n\(teamOne.full_name): \(teamScoreOne) \n\(teamTwo.full_name): \(teamScoreTwo) \n 1Q \(firstQuarterScore) \n HT \(htScore) \n 3Q \(thirdQuarterScore)"
        gameLog.append(resultText)
        print(resultText)
        
        print("\n\(teamOne.full_name) BOX SCORE:\n===============\n")
        for player in teamOne.roster {
            print("\(player.name): \(teamOneBoxScore[player.name] ?? 0) points")
        }
        
        print("\n\(teamTwo.full_name) BOX SCORE:\n===============\n")
        for player in teamTwo.roster {
            print("\(player.name): \(teamTwoBoxScore[player.name] ?? 0) points")
        }
    }
    
    
    //MARK: - Run Game
    func runGame() {
    
        //Each quarter broken down with commentary, could be improved.
        for quarter in 1...4 {
            if quarter == 1 {
                runIntro()
                runQuarter()
                let firstQuarterText = "At the end of the first quarter, the score is: \(teamOne.full_name): \(teamScoreOne) - \(teamTwo.full_name): \(teamScoreTwo)\n"
                firstQuarterScore = [teamOne.abbreviation: teamScoreOne, teamTwo.abbreviation : teamScoreTwo]
                gameLog.append(firstQuarterText)
            } else if quarter == 2 {
                runQuarter()
                let halfTimeText = "At half time, the score is: \(teamOne.full_name): \(teamScoreOne) - \(teamTwo.full_name): \(teamScoreTwo)\n"
                htScore = [teamOne.abbreviation: teamScoreOne, teamTwo.abbreviation : teamScoreTwo]
                gameLog.append(halfTimeText)
            } else if quarter == 3 {
                runQuarter()
                let thirdQuarterText = "At the end of the third quarter, the score is: \(teamOne.full_name): \(teamScoreOne) - \(teamTwo.full_name): \(teamScoreTwo)\n"
                thirdQuarterScore = [teamOne.abbreviation: teamScoreOne, teamTwo.abbreviation : teamScoreTwo]
                gameLog.append(thirdQuarterText)
            } else {
                runQuarter()
                let endGameText = "At the end of the game, the final score is: \(teamOne.full_name): \(teamScoreOne) - \(teamTwo.full_name): \(teamScoreTwo)"
                gameLog.append(endGameText)
            }
                    
        }
        
        if teamScoreOne == teamScoreTwo {
            runQuarter()
            print("At the end of overtime, the final score is: \n\(teamOne.full_name): \(teamScoreOne) \n\(teamTwo.full_name): \(teamScoreTwo)")
        } else {
            finishGameCommentary()
        }
    }
}
