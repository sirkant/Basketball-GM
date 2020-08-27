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
        playerNames =  ["Rueben Koogler", "Herbert Shelor", "Arnold Forth", "Dalton Oppenheim", "Albert Mckinney", "Tyree Doig", "Tyron Scheerer", "Duncan Kircher", "Hong Maxie", "Lonny Roybal", "Joseph Moses", "Ramiro Byford", "Neil Cheek", "Paris Richer", "Fritz Mcnelly", "Kris Glotfelty", "Fabian Tibbetts", "Colin Calley", "Rolando Combest", "Alberto Delpino", "Pasquale Swann", "Eddy Kinnaman", "Marco Guadalupe", "Porfirio Wint", "Shirley Mandeville", "Cedric Mahler", "Fletcher Jakes", "Luciano Alton", "Rodrigo Christmas", "Johnathan Flood", "Carmelo Baylor", "Darron Koeppel", "Alan Talor", "Felton Mclellan", "Jamaal Strobel", "Abdul Soliday",    "Jorge Ruocco", "Jordon Seawright", "Anderson Stephan", "Cruz Sellner","Simon Youngquist", "Delmar Swinger","Granville Buerger","Franklyn Bradley","Gus Shryock","Ramiro Mccants","George Socha","Les Shuey","Omer Venturini","Jeromy Aucoin","Brad Flurry","Jackson Merrick","Quincy Gish","Rich Christ","Aaron Shumaker","Hoyt Hoeft","Norman Thom","Christian Emrick", "Walker Barrier","Porter Despres","Kent Fraga", "Marty Gautier", "Willie Cone","Dong Woodcock","Issac Lovelace","Elijah Wilk","Otto Bondurant","Isiah Taormina","Carlton Stiger", "Horacio Kardos", "G/F 45 Broekhoff, Ryan","G 20 Burks, Alec","F/C 21 Embiid, Joel","F 12 Harris, Tobias", "F/C 42 Horford, Al", "G/F 30 Korkmaz, Furkan","G/F 18 Milton, Shake", "G 19 Neto, Raul", "F/C 9 O'Quinn, Kyle", "F 14 Pelle, Norvel", "G 0    Richardson, Josh", "F 40 Robinson, Glenn", "F 1 Scott, Mike", "G 35 Shayok, Marial", "G/F 25 Simmons, Ben", "G 5 Smith, Zhaire", "G 22 Thybulle, Matisse", "F 3 Anunoby, OG", "F/C 25 Boucher, Chris", "G/F 12 Brissett, Oshae", "G 0 Davis, Terence", "C 33 Gasol, Marc", "F/C 20 Hernandez, Dewan", "F 4 Hollis-Jefferson, Rondae", "C 9 Ibaka, Serge", "G/F 5 Johnson, Stanley", "G 7 Lowry, Kyle", "G 22 McCaw, Patrick", "G/F 13 Miller, Malcolm", "G 24 Powell, Norman", "F 43 Siakam, Pascal", "G 21 Thomas, Matt", "G 23 VanVleet, Fred", "F 1 Watson, Paul"]
        
        
        teamNamesThisGame = ["":""]
            
        }
    

    func pickRandomPlayerNames() -> String {
        if let name = playerNames.randomElement() {
            playerNames.remove(at: playerNames.firstIndex(of: name)!)
            return name
        } else {
            return "Could not name a player"
        }
        
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


