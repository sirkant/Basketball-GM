//
//  NameGenerator.swift
//  Basketball GM
//
//  Created by Luis Caceres on 2020-05-11.
//  Copyright © 2020 Luis Caceres. All rights reserved.
//

import Foundation

class NameGenerator: NSObject {
    static let sharedInstance = NameGenerator()
    var playerNames : [String]
    var teamNamesThisGame : [String : String]
    
    override init() {
        playerNames =  ["Rueben Koogler", "Herbert Shelor", "Arnold Forth", "Dalton Oppenheim", "Albert Mckinney", "Tyree Doig", "Tyron Scheerer", "Duncan Kircher", "Hong Maxie", "Lonny Roybal", "Joseph Moses", "Ramiro Byford", "Neil Cheek", "Paris Richer", "Fritz Mcnelly", "Kris Glotfelty", "Fabian Tibbetts", "Colin Calley", "Rolando Combest", "Alberto Delpino", "Pasquale Swann", "Eddy Kinnaman", "Marco Guadalupe", "Porfirio Wint", "Shirley Mandeville", "Cedric Mahler", "Fletcher Jakes", "Luciano Alton", "Rodrigo Christmas", "Johnathan Flood", "Carmelo Baylor", "Darron Koeppel", "Alan Talor", "Felton Mclellan", "Jamaal Strobel", "Abdul Soliday",    "Jorge Ruocco", "Jordon Seawright", "Anderson Stephan", "Cruz Sellner","Simon Youngquist", "Delmar Swinger","Granville Buerger","Franklyn Bradley","Gus Shryock","Ramiro Mccants","George Socha","Les Shuey","Omer Venturini","Jeromy Aucoin","Brad Flurry","Jackson Merrick","Quincy Gish","Rich Christ","Aaron Shumaker","Hoyt Hoeft","Norman Thom","Christian Emrick", "Walker Barrier","Porter Despres","Kent Fraga", "Marty Gautier",
        "Willie Cone","Dong Woodcock","Issac Lovelace","Elijah Wilk","Otto Bondurant","Isiah Taormina","Carlton Stiger", "Horacio Kardos"]
        
        teamNamesThisGame = ["":""]
            
        }
    

    func pickRandomPlayerNames() -> String {
        if let name = playerNames.randomElement() {
            playerNames.remove(at: playerNames.firstIndex(of: name)!)
            return name
        }
        return "John Doe"
    }
    
    func pickRandomTeamName() -> String {
        for (teamName,teamCode) in K.teamNames {
            teamNamesThisGame.updateValue(teamCode, forKey: teamName)
        }
        
        if let team = K.teamNames.randomElement() {
            teamNamesThisGame[team.key] = nil
            return team.key
        }
        return "New Mexico Aztecs"
    }
    
    func getShortName(teamName : String) -> String {
        if let teamShort = K.teamNames[teamName] {
            return teamShort
        } else {
            return "RMA"
        }
    }
    
}


