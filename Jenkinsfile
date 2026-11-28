pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        CI_DB_PASSWORD = 'ci_only_password'
        DB_HOST = 'shopsphere-ci-db'
        DB_PORT = '5432'
        DB_USER = 'shopsphere'
        DB_PASSWORD = 'ci_only_password'
        JWT_SECRET = 'shopsphere_ci_test_secret_only'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo 'ShopSphere source code checked out.'
            }
        }

        stage('Start Test Database') {
            steps {
                sh '''
                    set -eu

                    docker rm -f shopsphere-ci-db >/dev/null 2>&1 || true

                    docker run -d \
                        --name shopsphere-ci-db \
                        --network jenkins_default \
                        --network-alias shopsphere-ci-db \
                        --health-cmd "pg_isready -U shopsphere -d shopsphere_auth_test" \
                        --health-interval 2s \
                        --health-timeout 3s \
                        --health-retries 30 \
                        -e POSTGRES_USER=shopsphere \
                        -e POSTGRES_PASSWORD="$CI_DB_PASSWORD" \
                        -e POSTGRES_DB=shopsphere_auth_test \
                        postgres:16-alpine

                    echo "Waiting for PostgreSQL initialization to finish..."

                    for attempt in $(seq 1 60); do
                        if docker logs shopsphere-ci-db 2>&1 | \
                            grep -qF "PostgreSQL init process complete; ready for start up."; then
                            break
                        fi

                        sleep 1
                    done

                    if ! docker logs shopsphere-ci-db 2>&1 | \
                        grep -qF "PostgreSQL init process complete; ready for start up."; then
                        echo "PostgreSQL initialization did not complete."
                        docker logs shopsphere-ci-db
                        exit 1
                    fi

                    echo "PostgreSQL initialization completed."

                    for attempt in $(seq 1 30); do
                        if docker exec shopsphere-ci-db \
                            pg_isready -U shopsphere -d shopsphere_auth_test; then
                            break
                        fi

                        sleep 2
                    done

                    docker exec shopsphere-ci-db \
                        pg_isready -U shopsphere -d shopsphere_auth_test

                    echo "Creating additional test databases..."

                    docker exec shopsphere-ci-db \
                        createdb -U shopsphere shopsphere_orders_test

                    docker exec shopsphere-ci-db \
                        createdb -U shopsphere shopsphere_products_test

                    echo "All CI test databases are ready."
                '''
            }
        }

        stage('Test Auth Service') {
            steps {
                withEnv(['DB_NAME=shopsphere_auth_test']) {
                    dir('services/auth-service') {
                        sh 'npm ci'
                        sh 'npm test'
                    }
                }
            }
        }

        stage('Test Product Service') {
            steps {
                withEnv(['DB_NAME=shopsphere_products_test']) {
                    dir('services/product-service') {
                        sh 'npm ci'
                        sh 'npm test'
                    }
                }
            }
        }

        stage('Test Order Service') {
            steps {
                withEnv(['DB_NAME=shopsphere_orders_test']) {
                    dir('services/order-service') {
                        sh 'npm ci'
                        sh 'npm test'
                    }
                }
            }
        }

        stage('Test Payment Service') {
            steps {
                dir('services/payment-service') {
                    sh 'npm ci'
                    sh 'npm test'
                }
            }
        }

        stage('API Gateway') {
            steps {
                echo 'No API Gateway Jest test files currently exist. Skipping.'
            }
        }
    }

    post {
        always {
            echo 'Cleaning up temporary CI database...'

            sh '''
                docker rm -f shopsphere-ci-db >/dev/null 2>&1 || true
            '''
        }

        success {
            echo 'ShopSphere CI tests completed successfully!'
        }

        failure {
            echo 'ShopSphere CI pipeline failed. Check the stage logs.'
        }
    }
}
