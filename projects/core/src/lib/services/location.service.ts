import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';

export interface State {
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly STATES_PATH = '../assets/states/states.json';
private readonly CITIES_PATH = '../assets/states';

  // Cache for states
  private statesCache$: Observable<State[]> | null = null;

  // Cache for cities by state - Map<stateName, Observable<string[]>>
  private citiesCache = new Map<string, Observable<string[]>>();

  // Cache for loaded state-city mappings
  private loadedStateNames = new Map<string, string>();

  constructor(private http: HttpClient) {
    this.initializeStateNameMapping();
  }

  /**
   * Initialize mapping of state names to file names
   * Maps "Andhra Pradesh" -> "Andhra_Pradesh"
   */
  private initializeStateNameMapping(): void {
    const fileNames = [
      'Andaman_and_Nicobar_Islands', 'Andhra_Pradesh', 'Arunachal_Pradesh',
      'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra_and_Nagar_Haveli',
      'Daman_and_Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal_Pradesh',
      'Jammu_and_Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh',
      'Lakshadweep', 'Madhya_Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
      'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan',
      'Sikkim', 'Tamil_Nadu', 'Telangana', 'Tripura', 'Uttar_Pradesh',
      'Uttarakhand', 'West_Bengal'
    ];

    fileNames.forEach(fileName => {
      const stateName = fileName.replace(/_/g, ' ');
      this.loadedStateNames.set(stateName, fileName);
    });
  }

  /**
   * Get all states (cached after first request)
   * @returns Observable of states array
   */
  getStates(): Observable<State[]> {
    if (!this.statesCache$) {
      this.statesCache$ = this.http.get<State[]>(this.STATES_PATH).pipe(
        tap(() => console.log('✓ States loaded')),
        shareReplay(1) // Cache the result
      );
    }
    return this.statesCache$;
  }

  /**
   * Get cities for a specific state (cached after first request)
   * @param stateName - Name of the state
   * @returns Observable of cities array
   */
  getCitiesByState(stateName: string): Observable<string[]> {
    // Return cached cities if available
    if (this.citiesCache.has(stateName)) {
      return this.citiesCache.get(stateName)!;
    }

    // Convert state name to file name
    const fileName = this.loadedStateNames.get(stateName);
    if (!fileName) {
      console.warn(`State not found: ${stateName}`);
      return of([]);
    }

    // Load and cache cities for this state
    const citiesCities$ = this.http.get<{ [key: string]: string[] }>(
      `${this.CITIES_PATH}/${fileName}.json`
    ).pipe(
      map(data => data[stateName] || []),
      tap(() => console.log(`✓ Cities for ${stateName} loaded`)),
      shareReplay(1) // Cache the result
    );

    this.citiesCache.set(stateName, citiesCities$);
    return citiesCities$;
  }

  /**
   * Get all states with their cities (useful for initialization)
   * @returns Observable of object with state names as keys and city arrays as values
   */
  getAllStatesWithCities(): Observable<{ [key: string]: string[] }> {
    return this.getStates().pipe(
      map(states => {
        return states.reduce((acc, state) => {
          this.getCitiesByState(state.name).subscribe(cities => {
            acc[state.name] = cities;
          });
          return acc;
        }, {} as { [key: string]: string[] });
      })
    );
  }

  /**
   * Clear all caches (useful for memory management or refresh)
   */
  clearCache(): void {
    this.statesCache$ = null;
    this.citiesCache.clear();
    console.log('✓ Location cache cleared');
  }

  /**
   * Get city suggestions based on search term (optional utility)
   * @param cities - Array of cities to search in
   * @param searchTerm - Search term
   * @returns Filtered array of matching cities
   */
  filterCities(cities: string[], searchTerm: string): string[] {
    if (!searchTerm) return cities;
    const lowerTerm = searchTerm.toLowerCase();
    return cities.filter(city =>
      city.toLowerCase().includes(lowerTerm)
    );
  }

  /**
   * Get state name from partial match (useful for autocomplete)
   * @param states - Array of states to search in
   * @param searchTerm - Search term
   * @returns Filtered array of matching states
   */
  filterStates(states: State[], searchTerm: string): State[] {
    if (!searchTerm) return states;
    const lowerTerm = searchTerm.toLowerCase();
    return states.filter(state =>
      state.name.toLowerCase().includes(lowerTerm)
    );
  }
}
