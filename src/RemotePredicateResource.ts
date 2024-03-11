import Predicate from "./Predicate";
import { config } from "dotenv-safe";
config();

export default class RemotePredicateResource{
    private static ETAG;
    private readonly UPDATE_TIME = 2000 * 60;
    private mPredicate:Predicate;

    private constructor(predicate:Predicate){
        this.mPredicate = predicate;
        setInterval(async ()=>{
            const response = await RemotePredicateResource.fetchPredicate(`${process.env.PREDICATE_SERVICE_URL}/api/v1/predicate`);
            if(response){
                const pred = await response.text();
                this.mPredicate = Predicate.from_json(pred);
            }
        },this.UPDATE_TIME);
    }

    public static async from_env(): Promise<RemotePredicateResource | undefined>{
        try{
            let url = process.env.PREDICATE_SERVICE_URL as string;
            if(!url){
                throw new Error("Invalide predicate service url");
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
      const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const etag = response.headers.get('ETag');
        if(etag){
            RemotePredicateResource.ETAG = etag; 
        }
        return response;
    }

    private static async fetchPredicate(url: string): Promise<Response | undefined> {
        const etag = RemotePredicateResource.ETAG;
      
        if (!etag) {
          return await this.fetchPredicateAndStoreEtag(url);
        }
      
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
          console.log("updated the etag", newEtag);
          return response;
        } else {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
      }

    public get predicate():Predicate{
        return this.mPredicate;
    }
}