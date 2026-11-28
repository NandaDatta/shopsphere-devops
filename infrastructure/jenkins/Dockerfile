FROM jenkins/jenkins:lts-jdk21

USER root

# Install prerequisites
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    awscli \
    git \
    unzip && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg \
    -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc

# Add official Aqua Security Trivy repository
RUN install -m 0755 -d /usr/share/keyrings && \
    curl -fsSL https://aquasecurity.github.io/trivy-repo/deb/public.key | \
    gpg --dearmor -o /usr/share/keyrings/trivy.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb generic main" \
    > /etc/apt/sources.list.d/trivy.list

# Install Trivy vulnerability scanner
RUN apt-get update && \
    apt-get install -y --no-install-recommends trivy && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Add official Docker repository
RUN echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
    $(. /etc/os-release && echo ${VERSION_CODENAME}) stable" \
    > /etc/apt/sources.list.d/docker.list

# Install Docker CLI and Buildx
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    docker-ce-cli \
    docker-buildx-plugin && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js 22 and npm
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

USER jenkins
