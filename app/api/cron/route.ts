import { NextResponse } from "next/server";
import { getLowestPrice, getHighestPrice, getAveragePrice, getEmailNotifType } from "@/lib/utils";
import { connectToDB } from "@/lib/mongoose";
import Product from "@/lib/models/product.model";
import { scrapeAmazonProduct } from "@/lib/scraper";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";

export const maxDuration = 60; // This function can run for a maximum of 300 seconds
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    await connectToDB();
    console.log("MongoDB Connected");

    const products = await Product.find({});
    if (!products || products.length === 0) throw new Error("No products fetched");

    console.log(`Found ${products.length} products`);

    // ======================== 1 SCRAPE LATEST PRODUCT DETAILS & UPDATE DB
    const updatedProducts = await Promise.all(
      products.map(async (currentProduct) => {
        try {
          console.log(`Scraping product: ${currentProduct.url}`);
          // Scrape product
          const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);

          if (!scrapedProduct) {
            console.error(`Failed to scrape product: ${currentProduct.url}`);
            return currentProduct; // Continue with the next product
          }

          const updatedPriceHistory = [
            ...currentProduct.priceHistory,
            {
              price: scrapedProduct.currentPrice,
              date: new Date(),
            },
          ];

          const product = {
            ...scrapedProduct,
            priceHistory: updatedPriceHistory,
            lowestPrice: getLowestPrice(updatedPriceHistory),
            highestPrice: getHighestPrice(updatedPriceHistory),
            averagePrice: getAveragePrice(updatedPriceHistory),
          };

          // Update Product in DB
          const updatedProduct = await Product.findOneAndUpdate(
            { url: product.url },
            product,
            { new: true }
          );

          console.log(`Updated product: ${updatedProduct.url}`);

          // ======================== 2 CHECK EACH PRODUCT'S STATUS & SEND EMAIL ACCORDINGLY
          const emailNotifType = getEmailNotifType(scrapedProduct, currentProduct);

          if (emailNotifType && updatedProduct.users.length > 0) {
            const productInfo = {
              title: updatedProduct.title,
              url: updatedProduct.url,
            };
            // Construct emailContent
            const emailContent = await generateEmailBody(productInfo, emailNotifType);
            // Get array of user emails
            const userEmails = updatedProduct.users.map((user: any) => user.email);
            // Send email notification
            await sendEmail(emailContent, userEmails);
            console.log(`Sent email notifications for product: ${updatedProduct.url}`);
          }

          return updatedProduct;
        } catch (error) {
          console.error(`Failed to process product ${currentProduct.url}:`, error.message);
          return currentProduct; // Continue with the next product
        }
      })
    );

    return NextResponse.json({
      message: "Ok",
      data: updatedProducts,
    });
  } catch (error: any) {
    console.error('Failed to get all products:', error.message);
    return NextResponse.json({
      message: `Failed to get all products: ${error.message}`
    }, { status: 500 });
  }
}
