//
//  LeagueSimulation.swift
//  Basketball GM
//
//  Created by Luis Caceres on 2020-05-11.
//  Copyright © 2020 Luis Caceres. All rights reserved.
//

import UIKit

class LeagueSimulation: NSObject {
    static let sharedInstance = LeagueSimulation()
    var gameStats : [String: [String : Int]]
    
    override init() {
        self.gameStats = [String: [String : Int]]()
    }
    
    func addStats(player: String, stat: String, value: Int) {
        if gameStats[player]?[stat] != nil {
            gameStats[player]![stat]! += value
        } else {
            gameStats[player]?.updateValue(value, forKey: stat)
        }
        
    }
    
    func presentStats() {
            print(gameStats)
    }

}

