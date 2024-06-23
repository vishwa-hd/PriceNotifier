"use client"

import { scrapeAndStoreProduct } from "@/lib/actions";
import { FormEvent, useState } from "react";
const isValidAmazonProductURL = (url: string) => {
  try{
    const parsedURL = new URL(url);
    const hostname = parsedURL.hostname;
    if(hostname.includes('amazon.com') ||
      hostname.includes ('m.media-amazon.com') ||
      hostname.includes ('amazon.') ||
      hostname.endsWith('amazon')
    ) {
      return true;
    }
  }catch (error) {

  }
  return false;

}

const Searchbar = () => {
  const[searchPromt, setsearchPromt] = useState('');
  const[isLoding, setIsLoding] = useState(false);

  const handleSubmit =async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isValidLink =isValidAmazonProductURL(searchPromt);
    if(!isValidLink) return alert('pleace provide a valid Amazon link')
    try{
      setIsLoding(true);
      
      // scrap the product page
      const product = await scrapeAndStoreProduct(searchPromt);
    } catch (error){
      console.log(error);
    } finally{
      setIsLoding(false)
    }
  }
  return (
    <form
    className='flex flex-wrap gap-4 mt-12'
    onSubmit={handleSubmit}
    >
        <input
        type="text"
        value={searchPromt}
        onChange={(e) => setsearchPromt(e.target.value)}
        placeholder="enter product link"
        className="searchbar-input"
        />

        <button 
        type="submit"
        className="searchbar-btn"
        disabled={searchPromt ===''}
        >
            {isLoding ? 'searching....':'search'}

        </button>

    </form>
  )
}

export default Searchbar