Rails.application.routes.draw do
  resources :attendances, only: [:index,:create]
  resources :disciplines,only: [:index, :show, :create, :update, :destroy]
  resources :parent_students, only: [:index, :create]
  resources :parents,only: [:index, :show, :create]
  resources :students
  resources :teachers,only: [:show]
  resources :classrooms, only: [:index, :show]
  post '/login', to: 'auth#create'
  post '/parent_login', to: 'parent_auth#create'
  post '/admin_login', to: 'admin_auth#create'
  get '/profile', to: 'teachers#profile'
  get 'teacher/parent/', to: 'teachers#classroom_parents'

  scope path: :admin, module: :admin_api, as: :admin do
    get '/profile', to: 'admins#profile'
    get '/summary', to: 'summary#index'
    resources :admins
    resources :teachers
    resources :classrooms
    resources :students
    resources :parents
    resources :parent_students, only: [:index, :create, :update, :destroy]
    resources :attendances, only: [:index, :destroy]
    resources :disciplines, only: [:index, :show, :create, :update, :destroy]
  end
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"
end
