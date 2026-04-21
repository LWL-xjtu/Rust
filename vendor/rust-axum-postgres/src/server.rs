use axum::Router;
use tokio::net::TcpListener;

pub async fn start_server(app: Router, server_address: String)  {
  // create our TCP listener
  let listener = TcpListener::bind(server_address)
    .await
    .expect("Could not create TCP Listener");

  println!("Listening on {}", listener.local_addr().unwrap());

  // serve the app
  axum::serve(listener, app)
    .await
    .expect("Error serving application");
}