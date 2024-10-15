document.addEventListener('DOMContentLoaded', () => {
  const filmsList = document.getElementById('films');
  const moviePoster = document.getElementById('poster');
  const movieTitle = document.getElementById('title');
  const movieRuntime = document.getElementById('runtime');
  const movieDescription = document.getElementById('film-info');
  const movieShowtime = document.getElementById('showtime');
  const remainingTickets = document.getElementById('ticket-num');
  const ticketButton = document.getElementById('buy-ticket');

  loadInitialFilm();
  loadAllFilms();
  ticketButton.addEventListener('click', handleTicketPurchase);

  filmsList.addEventListener('click', (event) => {
    const deleteButton = event.target.closest('.delete-button');
    if (deleteButton) {
      const selectedFilmId = deleteButton.dataset.filmId;
      removeFilm(selectedFilmId);
    }
  });

  function loadInitialFilm() {
    fetch('/films/1')
      .then(response => response.json())
      .then(film => {
        updateFilmDetails(film);
      })
      .catch(error => console.error(error));
  }

  function loadAllFilms() {
    fetch('/films')
      .then(response => response.json())
      .then(films => {
        films.forEach(film => {
          const filmElement = document.createElement('li');
          filmElement.classList.add('film', 'item');
          filmElement.dataset.filmId = film.id;
          filmElement.textContent = film.title;
          filmElement.addEventListener('click', () => updateFilmDetails(film));

          const deleteButton = document.createElement('button');
          deleteButton.classList.add('delete-button');
          deleteButton.dataset.filmId = film.id;
          deleteButton.textContent = 'Delete';
          filmElement.appendChild(deleteButton);

          if (film.tickets_sold >= film.capacity) {
            filmElement.classList.add('sold-out');
          }

          filmsList.appendChild(filmElement);
        });
      })
      .catch(error => console.error(error));
  }

  function updateFilmDetails(film) {
    moviePoster.src = film.poster;
    movieTitle.textContent = film.title;
    movieTitle.dataset.filmId = film.id;
    movieRuntime.textContent = `${film.runtime} minutes`;
    movieDescription.textContent = film.description;
    movieShowtime.textContent = film.showtime;
    updateAvailableTickets(film.capacity, film.tickets_sold);
  }

  function updateAvailableTickets(capacity, ticketsSold) {
    const available = capacity - ticketsSold;
    remainingTickets.textContent = available;

    if (available === 0) {
      ticketButton.disabled = true;
      ticketButton.textContent = 'Sold Out';
    } else {
      ticketButton.disabled = false;
      ticketButton.textContent = 'Buy Ticket';
    }
  }

  function handleTicketPurchase() {
    const filmId = movieTitle.dataset.filmId;
    const ticketsSold = parseInt(remainingTickets.textContent, 10);
    const availableTickets = parseInt(remainingTickets.textContent, 10);
    
    if (availableTickets <= 0) {
      alert('No tickets available!');
      return;
    }

    const updatedTicketsSold = ticketsSold + 1;

    fetch(`http://localhost:3000/films/${filmId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tickets_sold: updatedTicketsSold })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to update film: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then(updatedFilm => {
        updateAvailableTickets(updatedFilm.capacity, updatedFilm.tickets_sold);

        return fetch('http://localhost:3000/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ film_id: updatedFilm.id, number_of_tickets: 1 })
        });
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to create ticket: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then(newTicket => {
        console.log('New ticket created:', newTicket);
      })
      .catch(error => console.error(error));
  }

  function removeFilm(filmId) {
    fetch(`http://localhost:3000/films/${filmId}`, {
      method: 'DELETE'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to delete film: ${response.status} - ${response.statusText}`);
        }
        const filmElement = document.querySelector(`li[data-film-id="${filmId}"]`);
        filmElement.remove();
      })
      .catch(error => console.error(error));
  }
});