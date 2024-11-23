/** IGB-Field
 *
 * Copyright © 2024 Hauke Dämpfling (haukex@zero-g.net)
 * at the Leibniz Institute of Freshwater Ecology and Inland Fisheries (IGB),
 * Berlin, Germany, <https://www.igb-berlin.de/>
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Initial thoughts from the brainstorming:
 * - Sampling Trip: project_id, name, description (saved template values?)
 *   - Individual values: date, sampling by, weather today, final notes
 *   - Sampling Point: id, name, description, project_id, coordinates (saved template values?)
 *     - Individual values: current date, current time, current coordinates
 * - Measurements: pH, conductivity, oxygen saturation, oxygen concentration, temperature, level, notes, photo(s)
 *   - pH: 1...pH....14 (2 Stellen nach Komma)
 *   - Cond. 1...Leitfähigkeit....10000 µS cm (ohne Komma)
 *   - Temp. -2°C....Temperatur...+35 °C (1 Stelle nach Komma)
 *   - O2% 0...Sauerstoffsättigung...150%
 *   - O2mg 0...Sauerstoffkonzentration...14,6 mg L
 *   - Level 0...Pegel...x cm (ohne Komma)
 */
