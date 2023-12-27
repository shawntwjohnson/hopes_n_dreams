// nba-scraper.js (Updated Script)

import puppeteer from 'puppeteer';
import cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.join(__dirname, '..', 'data', 'nba', 'odds.json');

const scrapeNBAOdds = async () => {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    const url = 'https://www.oddsshark.com/nba/odds';
    await page.goto(url, { waitUntil: 'networkidle2' });

    const content = await page.content();
    const $ = cheerio.load(content);
    const events = [];

    $('.odds--group__event-container').each((i, element) => {
        const $element = $(element);
        const eventId = $element.attr('data-id');
        const eventDateAttr = $element.attr('data-event-date');
        const teams = $element.find('.participant-name span').map((_, el) => $(el).text()).get();
        
        // New code to scrape the game start date and time
        const dateString = $element.prevAll('.odds--group__details-date').first().find('h3 .long-date').text().trim();
        const timeString = $element.find('.odds--group__event-time').text().trim();

        const oddsData = $element.find('.odds--group__event-books').children().map((_, book) => {
            const bookType = $(book).find('.data-headers .book-name').text().trim() || 'Opening';
            const rows = $(book).find('.first-row, .second-row');

            const odds = rows.map((index, row) => {
                const teamName = teams[index];

                // Select only the first two divs for each odds type
                const spreadDivs = $(row).find('.odds-spread div').slice(0, 2);
                const totalDivs = $(row).find('.odds-total div').slice(0, 2);

                const spread = spreadDivs.first().text();
                const spreadOdds = spreadDivs.last().text();
                const moneyline = $(row).find('.odds-moneyline div').first().text();
                const total = totalDivs.first().text();
                const totalOdds = totalDivs.last().text();

                return {
                    teamName,
                    spread: `${spread}, ${spreadOdds}`,
                    moneyline,
                    total: `${total}, ${totalOdds}`
                };
            }).get();

            return { bookType, odds };
        }).get();

        events.push({
            eventId,
            eventDate: dateString,
            eventTime: timeString,
            teams,
            oddsData
        });
    });

    await browser.close();

    await fs.promises.writeFile(outputPath, JSON.stringify(events, null, 2));
    console.log(`Scraping done, data saved to ${outputPath}`);
};

export { scrapeNBAOdds };
