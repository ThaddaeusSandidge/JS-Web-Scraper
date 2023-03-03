// Define the URL of the website to scrape
const url = 'https://models.com/agencies/';

// Fetch the website HTML content
fetch(url)
  .then(response => response.text())
  .then(html => {
    // Parse the HTML content using a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Select the agency boxes and extract the agency names and links
    const agencyBoxes = doc.querySelectorAll('.agencybox');
    const agencyData = Array.from(agencyBoxes).map(box => {
      const name = box.querySelector('h2').textContent.trim().replace(/\s+/g, '-');
      const link = `https://models.com${box.querySelector('a').getAttribute('href')}`;
      return { name, link };
    });

    // Fetch the agency pages and scrape the website, email, about section, instagram url, and image url
    const promises = agencyData.map(data => {
      return fetch(data.link)
        .then(response => response.text())
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const website = doc.querySelector('.small-9.columns').innerHTML.match(/<a href="([^"]+)"/)?.[1] || '';
          const email = doc.querySelector('.small-9.columns a[href^="mailto:"]')?.getAttribute('href').replace(/^mailto:/, '') || '';
          let about = doc.querySelector('#agencyDescription')?.innerHTML.trim() || '';
          if (!about) {
            about = doc.querySelector('#desc')?.innerHTML.trim() || '';
            about = about.replace(/<br>/g, '\n');
            about = about.replace(/<p>/g, '');
          } else {
            console.log(about);
            about = about.replace(/<br>/g, '\n');
          }
          const socialLinks = doc.querySelector('#socialLinks');
          const instagram = socialLinks ? socialLinks.querySelector('a[title="instagram"]')?.getAttribute('href') || '' : '';
          const agencyLogoDesktop = doc.querySelector('#agencyLogoDesktop');
          const image = agencyLogoDesktop ? agencyLogoDesktop.querySelector('img')?.getAttribute('src') || '' : '';
          const location = doc.querySelector('.maplink a')?.getAttribute('href').split('q=')[1].replace(/\+/g, ' ').trim().replace(/[\r\n]+/g, '') || '';
          return { name: data.name, website, email, about, instagram, image, location };
        })
        .catch(error => {
          console.error(`Failed to fetch ${data.link}: ${error}`);
          return { name: data.name, website: '', email: '', about: '', instagram: '', image: '', location: '' };
        });
    });

    // Combine the scraped data and output the results to a text file
    Promise.all(promises)
      .then(results => {
        const output = results.map(data => {
          return `name: ${data.name}\nwebsite: ${data.website}\nemail: ${data.email}\nabout: ${data.about}\ninstagram: ${data.instagram}\nimage: ${data.image}\nlocation: ${data.location}\n`;
        }).join('\n');
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'agency_data.txt';
        link.click();
      })
      .catch(error => console.error(error));
  })
  .catch(error => console.error(error));
