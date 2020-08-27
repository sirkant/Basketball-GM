//
//  OnlineDataManager.swift
//  Basketball GM
//
//  Created by Luis Caceres on 2020-05-20.
//  Copyright © 2020 Luis Caceres. All rights reserved.
//

import Foundation

protocol OnlineDataManagerDelegate {
    func didUpdatePlayerData(dataManager: OnlineDataManager, playerTeamData: PlayerDataModel)
    func didFailWithError(error: Error)
    func didUpdateTeamData(dataManager: OnlineDataManager, teamData: [Team])
}

struct OnlineDataManager {
    let dataURL = "https://www.balldontlie.io/api/v1"
    
    var delegate : OnlineDataManagerDelegate?
    
    func fetchPlayers() {
        let urlString = "\(dataURL)/players"
        performRequest(urlString: urlString)
        print(urlString)
    }
    
    func fetchTeams() {
        //0. Configure the input for the URL
        let urlString = "\(dataURL)/teams"
        performRequest(urlString: urlString)
    }
    
    //    Networking!
    func performRequest(urlString: String) {
        if urlString.contains("players") {
            if let url = URL(string: urlString) {
                let session = URLSession(configuration: .default)
                let task = session.dataTask(with: url) { (data, response, error) in
                    if error != nil {
                        self.delegate?.didFailWithError(error: error!)
                        return
                    }
                    if let safeData = data {
                        if let dataFromWorld = self.parseJSON(playerData: safeData) {
                            self.delegate?.didUpdatePlayerData(dataManager: self, playerTeamData: dataFromWorld)
                        }
                    }
                }
                task.resume()
            }
        } else {
            if let url = URL(string: urlString) {
                let session = URLSession(configuration: .default)
                let task = session.dataTask(with: url) { (data, response, error) in
                    if error != nil {
                        self.delegate?.didFailWithError(error: error!)
                        return
                    }
                    if let safeData = data {
                        if let dataFromWorld = self.parseJSONwithTeamData(teamData: safeData) {
                            self.delegate?.didUpdateTeamData(dataManager: self, teamData: dataFromWorld)
                        }
                    }
                }
                task.resume()
            }
        }
    }
    
    //MARK: - Player info mapping
    func parseJSON(playerData: Data) -> PlayerDataModel? {
        let decoder = JSONDecoder()
        do {
            let decodedData = try decoder.decode(PlayerData.self, from: playerData)
            print("\(decodedData)")
            let id = decodedData.data[0].id
            let first_name = decodedData.data[0].first_name
            let last_name = decodedData.data[0].last_name
            let position = decodedData.data[0].position
            let team_id = 12
//                Int(decodedData.data[0].team[0].id)

            let updatedData = PlayerDataModel(player_id: id, first_name: first_name, last_name: last_name, position: position, team_id : team_id)
            return updatedData
        } catch {
            self.delegate?.didFailWithError(error: error)
            return nil
        }
    }
    
    
    //MARK: - Team info mapping
    func parseJSONwithTeamData(teamData: Data) -> [Team]? {
        let decoder = JSONDecoder()
        do {
            let decodedData = try decoder.decode(TeamData.self, from: teamData)
            var teamList : [Team] = []
            
            for n in 0...29 {
                let newTeam = makeRandomTeam()
                newTeam.id = Int(decodedData.data[n].id)
                newTeam.abbreviation = decodedData.data[n].abbreviation
                newTeam.city = decodedData.data[n].city
                newTeam.conference = decodedData.data[n].conference
                newTeam.division = decodedData.data[n].division
                newTeam.full_name = decodedData.data[n].full_name
                newTeam.name = decodedData.data[n].name
                
                teamList.append(newTeam)
            }
            return teamList
        } catch {
            self.delegate?.didFailWithError(error: error)
            return nil
        }
        
    }
    
}
