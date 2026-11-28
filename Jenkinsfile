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



        stage('Build Docker Images') {
            steps {
                script {
                    def imageTag = sh(
                        script: 'git rev-parse --short=12 HEAD',
                        returnStdout: true
                    ).trim()

                    echo "Building Docker images with tag: ${imageTag}"

                    sh """
                        set -eu

                        docker build -t shopsphere-api-gateway:${imageTag} services/api-gateway
                        docker build -t shopsphere-auth-service:${imageTag} services/auth-service
                        docker build -t shopsphere-product-service:${imageTag} services/product-service
                        docker build -t shopsphere-order-service:${imageTag} services/order-service
                        docker build -t shopsphere-payment-service:${imageTag} services/payment-service

                        echo "All five Docker images built successfully."
                    """
                }
            }
        }

        stage('Trivy Security Scan') {
            steps {
                script {
                    def imageTag = sh(
                        script: 'git rev-parse --short=12 HEAD',
                        returnStdout: true
                    ).trim()

                    echo "Scanning Docker images tagged: ${imageTag}"

                    sh """
                        set -eu

                        trivy image \
                            --scanners vuln \
                            --severity HIGH,CRITICAL \
                            --exit-code 1 \
                            --no-progress \
                            shopsphere-api-gateway:${imageTag}

                        trivy image \
                            --scanners vuln \
                            --severity HIGH,CRITICAL \
                            --exit-code 1 \
                            --no-progress \
                            shopsphere-auth-service:${imageTag}

                        trivy image \
                            --scanners vuln \
                            --severity HIGH,CRITICAL \
                            --exit-code 1 \
                            --no-progress \
                            shopsphere-product-service:${imageTag}

                        trivy image \
                            --scanners vuln \
                            --severity HIGH,CRITICAL \
                            --exit-code 1 \
                            --no-progress \
                            shopsphere-order-service:${imageTag}

                        trivy image \
                            --scanners vuln \
                            --severity HIGH,CRITICAL \
                            --exit-code 1 \
                            --no-progress \
                            shopsphere-payment-service:${imageTag}

                        echo "All five Docker images passed Trivy security scanning."
                    """
                }
            }
        }

        stage('Push Images to AWS ECR') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'aws-ecr-jenkins',
                        usernameVariable: 'AWS_ACCESS_KEY_ID',
                        passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                    )
                ]) {
                    sh '''
                        set -eu

                        export AWS_DEFAULT_REGION=ap-south-1

                        ACCOUNT_ID=727876783162
                        REGISTRY="${ACCOUNT_ID}.dkr.ecr.ap-south-1.amazonaws.com"
                        IMAGE_TAG=$(git rev-parse --short=12 HEAD)

                        echo "Authenticating with AWS ECR..."

                        aws ecr get-login-password --region ap-south-1 |
                            docker login --username AWS --password-stdin "$REGISTRY"

                        SERVICES="
                        api-gateway
                        auth-service
                        product-service
                        order-service
                        payment-service
                        "

                        for SERVICE in $SERVICES; do
                            IMAGE="shopsphere-${SERVICE}"

                            echo "Pushing ${IMAGE}:${IMAGE_TAG}..."

                            docker tag "${IMAGE}:${IMAGE_TAG}" \
                                "${REGISTRY}/${IMAGE}:${IMAGE_TAG}"

                            docker push "${REGISTRY}/${IMAGE}:${IMAGE_TAG}"
                        done

                        echo "All five images pushed successfully to AWS ECR."

                        docker logout "$REGISTRY"
                    '''
                }
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
