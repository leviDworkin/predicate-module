import Predicate from "./Predicate";
import { config } from "dotenv-safe";
config();

/**
 * Call the static from_env() method to fetch a predicate from an endpoint at the env var base url PREDICATE_SERVICE_URL + "/api/v1/predicate"
 * This api searches for updates to the predicate every 2 minutes. Call stopInteravl() to stop the fetching of updates
 */
export default class RemotePredicateResource{
    private static ETAG;
    private readonly UPDATE_TIME = 2000 * 60;
    private mPredicate:Predicate;
    private mInterval:NodeJS.Timeout;

    private constructor(predicate:Predicate){
        this.mPredicate = predicate;
        this.startInterval();
    }

    public static async from_env(): Promise<RemotePredicateResource | undefined>{
        try{
            let url = process.env.PREDICATE_SERVICE_URL as string;
            if(!url){
                throw new Error("Invalid predicate service url");
            }
            url = `${url}/api/v1/predicate`;
            const response = await this.fetchPredicate(url);
            if(response){
                const pred = await response.text();
                const predicate = Predicate.from_json(pred);
                return new RemotePredicateResource(predicate);
            }
        }catch(error){
            throw new Error(error);
        }
    }

    private static async fetchPredicateAndStoreEtag(url:string): Promise<Response | undefined>{
      try{
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const etag = response.headers.get('ETag');
        if(etag){
            RemotePredicateResource.ETAG = etag; 
        }
        return response;
      }catch(error){
        throw new Error(error);
      }
    }

    private static async fetchPredicate(url: string): Promise<Response | undefined> {
        const etag = RemotePredicateResource.ETAG;
      
        if (!etag) {
          return await this.fetchPredicateAndStoreEtag(url);
        }
      
        try{
          const response = await fetch(url, {
            headers: {
              'If-None-Match': etag,
            },
          });
        
          if (response.status === 304) {
            return undefined;
          } else if (response.ok) {
            const newEtag = response.headers.get('ETag');
            if(newEtag){
              RemotePredicateResource.ETAG = newEtag;
            }
            return response;
          } else {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
          }
        }catch(error){
          throw new Error(error);
        }
    }

    public startInterval():void{
      this.mInterval = setInterval(async ()=>{
        const response = await RemotePredicateResource.fetchPredicate(`${process.env.PREDICATE_SERVICE_URL}/api/v1/predicate`);
        if(response){
            const pred = await response.text();
            this.mPredicate = Predicate.from_json(pred);
        }
      },this.UPDATE_TIME);
    }

    public stopInterval():void{
        clearInterval(this.mInterval);
    }

    public get predicate():Predicate{
        return this.mPredicate;
    }
}